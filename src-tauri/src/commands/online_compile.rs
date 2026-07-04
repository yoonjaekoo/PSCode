use serde::{Deserialize, Serialize};

use super::compile::RunOutput;

#[derive(Debug, Serialize, Deserialize)]
struct OnlineCompileRequest {
    compiler: String,
    code: String,
    input: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct OnlineCompileResponse {
    output: String,
    error: String,
    status: String,
    exit_code: i32,
    signal: Option<i32>,
    time: String,
    total: String,
    memory: String,
}

#[tauri::command]
pub async fn online_compile_and_run(
    source_code: String,
    input: String,
    api_key: String,
) -> Result<RunOutput, String> {
    if api_key.is_empty() {
        return Err("API key is not set. Enter your OnlineCompiler.io API key in Settings.".to_string());
    }

    std::env::set_var("ONLINECOMPILER_API_KEY", &api_key);

    let client = reqwest::Client::new();

    let request_body = OnlineCompileRequest {
        compiler: "g++-15".to_string(),
        code: source_code,
        input,
    };

    let response = client
        .post("https://api.onlinecompiler.io/api/run-code-sync/")
        .header("Authorization", &api_key)
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("Online compiler request failed: {}", e))?;

    let result: OnlineCompileResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse online compiler response: {}", e))?;

    let success = result.status == "success" && result.exit_code == 0;
    let time_ms = (result.time.parse::<f64>().unwrap_or(0.0) * 1000.0) as u64;

    Ok(RunOutput {
        success,
        compile_output: if result.error.is_empty() && !success {
            String::new()
        } else {
            result.error.clone()
        },
        run_output: result.output,
        run_error: if success { String::new() } else { result.error },
        execution_time_ms: time_ms,
    })
}
