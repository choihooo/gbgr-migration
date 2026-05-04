use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, ChildStdin, ChildStdout, Command, Stdio};

enum SidecarCommand {
    Binary(PathBuf),
    PythonScript { python: String, script: PathBuf },
}

/// Python sidecar 프로세스 핸들
pub struct SidecarHandle {
    child: Child,
    stdin: ChildStdin,
    stdout: BufReader<ChildStdout>,
}

impl SidecarHandle {
    /// Python sidecar 프로세스를 실행한다.
    pub fn spawn() -> Result<Self, String> {
        let command = resolve_sidecar_command()?;
        let mut process = match command {
            SidecarCommand::Binary(binary) => Command::new(binary),
            SidecarCommand::PythonScript { python, script } => {
                let mut command = Command::new(python);
                command.arg(script);
                command
            }
        };

        let mut child = process
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::inherit())
            .spawn()
            .map_err(|e| format!("자세 엔진 sidecar 실행 실패: {e}"))?;

        let stdin = child.stdin.take().ok_or("stdin 파이프 획득 실패")?;
        let stdout = child.stdout.take().ok_or("stdout 파이프 획득 실패")?;

        Ok(Self {
            child,
            stdin,
            stdout: BufReader::new(stdout),
        })
    }

    /// JSON 명령을 stdin에 쓰고 stdout에서 한 줄을 읽는다.
    pub fn send_and_recv(
        &mut self,
        payload: &serde_json::Value,
    ) -> Result<serde_json::Value, String> {
        let line = serde_json::to_string(payload).map_err(|e| format!("JSON 직렬화 실패: {e}"))?;

        self.stdin
            .write_all(format!("{line}\n").as_bytes())
            .map_err(|e| format!("stdin 쓰기 실패: {e}"))?;
        self.stdin
            .flush()
            .map_err(|e| format!("stdin flush 실패: {e}"))?;

        let mut response = String::new();
        self.stdout
            .read_line(&mut response)
            .map_err(|e| format!("stdout 읽기 실패: {e}"))?;

        let trimmed = response.trim();
        if trimmed.is_empty() {
            return Err("sidecar가 빈 응답을 반환함".to_string());
        }

        serde_json::from_str(trimmed).map_err(|e| format!("sidecar 응답 파싱 실패: {e}"))
    }

    /// stdin에 JSON 명령만 쓴다 (응답을 기다리지 않음).
    #[allow(dead_code)]
    pub fn send_only(&mut self, payload: &serde_json::Value) -> Result<(), String> {
        let line = serde_json::to_string(payload).map_err(|e| format!("JSON 직렬화 실패: {e}"))?;
        self.stdin
            .write_all(format!("{line}\n").as_bytes())
            .map_err(|e| format!("stdin 쓰기 실패: {e}"))?;
        self.stdin
            .flush()
            .map_err(|e| format!("stdin flush 실패: {e}"))?;
        Ok(())
    }

    /// sidecar 프로세스를 종료한다.
    pub fn kill(&mut self) -> Result<(), String> {
        self.child
            .kill()
            .map_err(|e| format!("sidecar kill 실패: {e}"))
    }

    /// sidecar 프로세스가 아직 실행 중인지 확인한다.
    #[allow(dead_code)]
    pub fn is_alive(&mut self) -> bool {
        matches!(self.child.try_wait(), Ok(None))
    }
}

impl Drop for SidecarHandle {
    fn drop(&mut self) {
        let _ = self.kill();
    }
}

fn resolve_sidecar_command() -> Result<SidecarCommand, String> {
    // 환경변수로 명시된 경우 모드 무시하고 바이너리 사용
    if std::env::var("GBGR_POSTURE_ENGINE_BIN").is_ok() {
        if let Some(binary) = resolve_sidecar_binary()? {
            return Ok(SidecarCommand::Binary(binary));
        }
    }

    // release 빌드에서만 바이너리 우선 탐색 (dev에서는 Python 스크립트 사용)
    if !cfg!(debug_assertions) {
        if let Some(binary) = resolve_sidecar_binary()? {
            return Ok(SidecarCommand::Binary(binary));
        }
    }

    let script = resolve_sidecar_path()?;
    let python = find_python()?;
    Ok(SidecarCommand::PythonScript { python, script })
}

/// 프로덕션 패키징에서는 PyInstaller/Nuitka 등으로 만든 플랫폼별 실행 파일을 우선 사용한다.
fn resolve_sidecar_binary() -> Result<Option<PathBuf>, String> {
    if let Ok(path) = std::env::var("GBGR_POSTURE_ENGINE_BIN") {
        let env_path = PathBuf::from(path);
        if env_path.exists() {
            return Ok(Some(env_path));
        }
        return Err(format!(
            "GBGR_POSTURE_ENGINE_BIN이 존재하지 않는 경로를 가리킴: {env_path:?}"
        ));
    }

    for candidate in sidecar_binary_candidates()? {
        if candidate.exists() {
            return Ok(Some(candidate));
        }
    }

    Ok(None)
}

fn sidecar_binary_candidates() -> Result<Vec<PathBuf>, String> {
    let executable_names = if cfg!(windows) {
        vec!["posture-engine.exe"]
    } else {
        vec!["posture-engine"]
    };

    let mut base_dirs = Vec::new();
    base_dirs.push(std::env::current_dir().map_err(|e| format!("현재 디렉토리 조회 실패: {e}"))?);

    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            base_dirs.push(exe_dir.to_path_buf());
            base_dirs.push(exe_dir.join("resources"));
            base_dirs.push(exe_dir.join("../Resources"));
        }
    }

    let mut candidates = Vec::new();
    for base_dir in base_dirs {
        for ancestor in base_dir.ancestors() {
            for executable_name in &executable_names {
                candidates.push(ancestor.join("sidecar").join(executable_name));
                candidates.push(
                    ancestor
                        .join("sidecar")
                        .join("posture-engine-bin")
                        .join(executable_name),
                );
                candidates.push(
                    ancestor
                        .join("sidecar")
                        .join("posture-engine")
                        .join(executable_name),
                );
            }
        }
    }

    Ok(candidates)
}

/// Python sidecar 스크립트 경로를 찾는다.
/// 개발 중에는 프로젝트 루트 기준 sidecar/posture-engine/main.py를 사용한다.
fn resolve_sidecar_path() -> Result<PathBuf, String> {
    if let Ok(path) = std::env::var("GBGR_POSTURE_ENGINE_PATH") {
        let env_path = PathBuf::from(path);
        if env_path.exists() {
            return Ok(env_path);
        }
    }

    let cwd = std::env::current_dir().map_err(|e| format!("현재 디렉토리 조회 실패: {e}"))?;

    let mut candidates: Vec<PathBuf> = cwd.ancestors().map(sidecar_script_path).collect();

    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            candidates.extend([
                sidecar_script_path(exe_dir),
                sidecar_script_path(&exe_dir.join("resources")),
                sidecar_script_path(&exe_dir.join("../Resources")),
            ]);
        }
    }

    for candidate in &candidates {
        if candidate.exists() {
            return Ok(candidate.clone());
        }
    }

    Err(format!(
        "자세 엔진 sidecar를 찾을 수 없음: cwd={cwd:?}, candidates={candidates:?}"
    ))
}

fn sidecar_script_path(base_dir: &Path) -> PathBuf {
    base_dir
        .join("sidecar")
        .join("posture-engine")
        .join("main.py")
}

/// 사용 가능한 Python 실행 파일을 찾는다.
fn find_python() -> Result<String, String> {
    for cmd in &["python3", "python"] {
        if Command::new(cmd)
            .arg("--version")
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .is_ok()
        {
            return Ok(cmd.to_string());
        }
    }
    Err(
        "Python 실행 파일을 찾을 수 없음. 개발 모드는 python3/python과 MediaPipe 의존성이 필요하며, 배포 모드는 플랫폼별 자세 엔진 실행 파일이 필요함"
            .to_string(),
    )
}
