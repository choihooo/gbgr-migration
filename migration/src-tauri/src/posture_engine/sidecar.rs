use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::mpsc::{self, Receiver, RecvTimeoutError};
use std::thread;
use std::time::Duration;

const SIDECAR_RESPONSE_TIMEOUT: Duration = Duration::from_secs(180);
const SIDECAR_TIMEOUT_ERROR_CODE: &str = "SIDECAR_TIMEOUT";

enum SidecarCommand {
    Binary(PathBuf),
    PythonScript { python: String, script: PathBuf },
}

/// Python sidecar 프로세스 핸들
pub struct SidecarHandle {
    child: Child,
    stdin: ChildStdin,
    response_rx: Receiver<Result<String, String>>,
}

impl SidecarHandle {
    /// Python sidecar 프로세스를 실행한다.
    pub fn spawn() -> Result<Self, String> {
        let command = resolve_sidecar_command()?;
        Self::spawn_with_command(command)
    }

    fn spawn_with_command(command: SidecarCommand) -> Result<Self, String> {
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
        let (response_tx, response_rx) = mpsc::channel();

        thread::spawn(move || {
            let mut reader = BufReader::new(stdout);

            loop {
                let mut response = String::new();
                match reader.read_line(&mut response) {
                    Ok(0) => {
                        let _ = response_tx.send(Err("sidecar stdout가 닫혔습니다.".to_string()));
                        break;
                    }
                    Ok(_) => {
                        if response_tx.send(Ok(response)).is_err() {
                            break;
                        }
                    }
                    Err(error) => {
                        let _ = response_tx.send(Err(format!("stdout 읽기 실패: {error}")));
                        break;
                    }
                }
            }
        });

        Ok(Self {
            child,
            stdin,
            response_rx,
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

        let response = match wait_for_response(&self.response_rx, SIDECAR_RESPONSE_TIMEOUT) {
            Ok(response) => response,
            Err(error) => {
                let _ = self.kill();
                return Err(error);
            }
        };

        let trimmed = response.trim();
        if trimmed.is_empty() {
            let _ = self.kill();
            return Err("sidecar가 빈 응답을 반환함".to_string());
        }

        serde_json::from_str(trimmed)
            .map_err(|e| format!("sidecar 응답 파싱 실패: {e}"))
            .map_err(|error| {
                let _ = self.kill();
                error
            })
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

fn wait_for_response(
    response_rx: &Receiver<Result<String, String>>,
    timeout: Duration,
) -> Result<String, String> {
    match response_rx.recv_timeout(timeout) {
        Ok(response) => response,
        Err(RecvTimeoutError::Timeout) => Err(format!(
            "{SIDECAR_TIMEOUT_ERROR_CODE}: 자세 엔진 응답 대기 시간이 초과되었습니다."
        )),
        Err(RecvTimeoutError::Disconnected) => Err("sidecar 응답 채널이 닫혔습니다.".to_string()),
    }
}

impl Drop for SidecarHandle {
    fn drop(&mut self) {
        let _ = self.kill();
    }
}

fn resolve_sidecar_command() -> Result<SidecarCommand, String> {
    if cfg!(debug_assertions) {
        if std::env::var("GBGR_POSTURE_ENGINE_BIN").is_ok() {
            if let Some(binary) = resolve_env_sidecar_binary()? {
                return Ok(SidecarCommand::Binary(binary));
            }
        }

        let script = resolve_sidecar_path()?;
        let python = find_python()?;
        return Ok(SidecarCommand::PythonScript { python, script });
    }

    if std::env::var("GBGR_POSTURE_ENGINE_BIN").is_ok()
        || std::env::var("GBGR_POSTURE_ENGINE_PATH").is_ok()
    {
        return Err(
            "배포 빌드에서는 자세 엔진 환경변수 override를 사용할 수 없습니다.".to_string(),
        );
    }

    if let Some(binary) = resolve_packaged_sidecar_binary()? {
        return Ok(SidecarCommand::Binary(binary));
    }

    Err("배포용 자세 엔진 실행 파일을 찾을 수 없습니다.".to_string())
}

pub fn spawn_with_debug_fallback() -> Result<SidecarHandle, String> {
    if !cfg!(debug_assertions) {
        return SidecarHandle::spawn();
    }

    if let Some(binary) = resolve_env_sidecar_binary()? {
        match SidecarHandle::spawn_with_command(SidecarCommand::Binary(binary)) {
            Ok(handle) => return Ok(handle),
            Err(error) => {
                eprintln!(
                    "[posture-engine] debug binary sidecar 실행 실패, Python 스크립트로 폴백합니다: {error}"
                );
            }
        }
    }

    let script = resolve_sidecar_path()?;
    let python = find_python()?;
    SidecarHandle::spawn_with_command(SidecarCommand::PythonScript { python, script })
}

pub fn spawn_python_sidecar() -> Result<SidecarHandle, String> {
    let script = resolve_sidecar_path()?;
    let python = find_python()?;
    SidecarHandle::spawn_with_command(SidecarCommand::PythonScript { python, script })
}

fn resolve_env_sidecar_binary() -> Result<Option<PathBuf>, String> {
    let Ok(path) = std::env::var("GBGR_POSTURE_ENGINE_BIN") else {
        return Ok(None);
    };

    let env_path = PathBuf::from(path);
    if env_path.exists() {
        return Ok(Some(env_path));
    }

    Err(format!(
        "GBGR_POSTURE_ENGINE_BIN이 존재하지 않는 경로를 가리킴: {env_path:?}"
    ))
}

/// 프로덕션 패키징에서는 PyInstaller/Nuitka 등으로 만든 번들 내 실행 파일만 사용한다.
fn resolve_packaged_sidecar_binary() -> Result<Option<PathBuf>, String> {
    let executable_name = sidecar_executable_name();
    let candidates = packaged_sidecar_binary_candidates(executable_name)?;

    for candidate in candidates {
        if candidate.is_file() {
            return Ok(Some(candidate));
        }
    }

    Ok(None)
}

fn sidecar_executable_name() -> &'static str {
    if cfg!(windows) {
        "posture-engine.exe"
    } else {
        "posture-engine"
    }
}

fn packaged_sidecar_binary_candidates(executable_name: &str) -> Result<Vec<PathBuf>, String> {
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            return Ok(packaged_sidecar_binary_candidates_from_exe_dir(
                exe_dir,
                executable_name,
            ));
        }
    }

    Err("현재 실행 파일 경로를 확인할 수 없습니다.".to_string())
}

fn packaged_sidecar_binary_candidates_from_exe_dir(
    exe_dir: &Path,
    executable_name: &str,
) -> Vec<PathBuf> {
    [
        exe_dir.to_path_buf(),
        exe_dir.join("resources"),
        exe_dir.join("../Resources"),
    ]
    .into_iter()
    .flat_map(|base_dir| {
        [
            base_dir.join("sidecar").join(executable_name),
            base_dir
                .join("sidecar")
                .join("posture-engine")
                .join(executable_name),
        ]
    })
    .collect()
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
/// sidecar/posture-engine/.venv/bin/python3을 최우선으로 탐색한다.
fn find_python() -> Result<String, String> {
    // sidecar 스크립트 기준 상대 경로의 venv Python을 최우선 탐색
    if let Ok(script_path) = resolve_sidecar_path() {
        if let Some(sidecar_dir) = script_path.parent() {
            let venv_python = sidecar_dir.join(".venv").join("bin").join("python3");
            if venv_python.exists() {
                return Ok(venv_python.to_string_lossy().to_string());
            }
        }
    }

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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn wait_for_response_times_out_without_sender() {
        let (_tx, rx) = mpsc::channel();
        let result = wait_for_response(&rx, Duration::from_millis(50));

        assert!(result.is_err());
    }

    #[test]
    fn timeout_error_code_is_stable() {
        assert_eq!(SIDECAR_TIMEOUT_ERROR_CODE, "SIDECAR_TIMEOUT");
    }

    #[test]
    fn response_timeout_allows_packaged_sidecar_cold_start() {
        assert!(
            SIDECAR_RESPONSE_TIMEOUT >= Duration::from_secs(120),
            "PyInstaller/MediaPipe cold start can exceed 60 seconds on macOS"
        );
    }

    #[test]
    fn packaged_sidecar_candidates_are_executable_relative() {
        let exe_dir = Path::new("/Applications/Posture Turtle.app/Contents/MacOS");
        let candidates = packaged_sidecar_binary_candidates_from_exe_dir(exe_dir, "posture-engine");

        assert_eq!(
            candidates,
            vec![
                PathBuf::from(
                    "/Applications/Posture Turtle.app/Contents/MacOS/sidecar/posture-engine"
                ),
                PathBuf::from(
                    "/Applications/Posture Turtle.app/Contents/MacOS/sidecar/posture-engine/posture-engine"
                ),
                PathBuf::from(
                    "/Applications/Posture Turtle.app/Contents/MacOS/resources/sidecar/posture-engine"
                ),
                PathBuf::from(
                    "/Applications/Posture Turtle.app/Contents/MacOS/resources/sidecar/posture-engine/posture-engine"
                ),
                PathBuf::from(
                    "/Applications/Posture Turtle.app/Contents/MacOS/../Resources/sidecar/posture-engine"
                ),
                PathBuf::from(
                    "/Applications/Posture Turtle.app/Contents/MacOS/../Resources/sidecar/posture-engine/posture-engine"
                ),
            ]
        );
    }

    #[test]
    fn sidecar_executable_name_matches_platform() {
        let name = sidecar_executable_name();

        if cfg!(windows) {
            assert_eq!(name, "posture-engine.exe");
        } else {
            assert_eq!(name, "posture-engine");
        }
    }
}
