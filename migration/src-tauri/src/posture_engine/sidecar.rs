use std::io::{BufRead, BufReader, Write};
use std::path::PathBuf;
use std::process::{Child, ChildStdin, ChildStdout, Command, Stdio};

/// Python sidecar 프로세스 핸들
pub struct SidecarHandle {
    child: Child,
    stdin: ChildStdin,
    stdout: BufReader<ChildStdout>,
}

impl SidecarHandle {
    /// Python sidecar 프로세스를 실행한다.
    pub fn spawn() -> Result<Self, String> {
        let script = resolve_sidecar_path()?;
        let python = find_python()?;

        let mut child = Command::new(python)
            .arg(&script)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::inherit())
            .spawn()
            .map_err(|e| format!("sidecar spawn 실패: {e}"))?;

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

    let mut candidates: Vec<PathBuf> = cwd
        .ancestors()
        .map(|p| p.join("sidecar").join("posture-engine").join("main.py"))
        .collect();

    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            candidates.extend([
                exe_dir
                    .join("sidecar")
                    .join("posture-engine")
                    .join("main.py"),
                exe_dir
                    .join("resources")
                    .join("sidecar")
                    .join("posture-engine")
                    .join("main.py"),
                exe_dir
                    .join("../Resources")
                    .join("sidecar")
                    .join("posture-engine")
                    .join("main.py"),
            ]);
        }
    }

    for candidate in &candidates {
        if candidate.exists() {
            return Ok(candidate.clone());
        }
    }

    Err(format!(
        "sidecar 스크립트를 찾을 수 없음: cwd={cwd:?}, candidates={candidates:?}"
    ))
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
    Err("python3/python 실행 파일을 찾을 수 없음".to_string())
}
