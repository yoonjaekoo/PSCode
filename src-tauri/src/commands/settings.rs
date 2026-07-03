use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

use super::fs_ops::default_workspace_root;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub language: String,
    pub compiler_path: String,
    pub workspace_root: String,
    pub autosave_interval_ms: u64,
    pub recent_files: Vec<String>,
    pub sidebar_collapsed: bool,
    pub console_height: u32,
    pub git_url: String,
    pub snippets_enabled: bool,
    pub enabled_snippets: std::collections::HashMap<String, bool>,
    pub api_key: String,
    pub use_online_compiler: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            language: "en".to_string(),
            compiler_path: String::new(),
            workspace_root: default_workspace_root().to_string_lossy().to_string(),
            autosave_interval_ms: 800,
            recent_files: Vec::new(),
            sidebar_collapsed: false,
            console_height: 200,
            git_url: String::new(),
            snippets_enabled: true,
            enabled_snippets: std::collections::HashMap::new(),
            api_key: String::new(),
            use_online_compiler: false,
        }
    }
}

fn settings_path(app_data_dir: &PathBuf) -> PathBuf {
    app_data_dir.join(".pscode").join("settings.json")
}

#[tauri::command]
pub fn get_settings(app: tauri::AppHandle) -> Result<AppSettings, String> {
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    let path = settings_path(&app_data);
    if !path.exists() {
        let defaults = AppSettings::default();
        save_settings_internal(&app_data, &defaults)?;
        return Ok(defaults);
    }

    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

fn save_settings_internal(app_data_dir: &PathBuf, settings: &AppSettings) -> Result<(), String> {
    let path = settings_path(app_data_dir);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let content = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_settings(app: tauri::AppHandle, settings: AppSettings) -> Result<(), String> {
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    save_settings_internal(&app_data, &settings)
}
