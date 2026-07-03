use chrono::Local;
use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};

const DEFAULT_TEMPLATE: &str = r#"#include <bits/stdc++.h>
using namespace std;

int main() {
ios::sync_with_stdio(0);
cin.tie(0);

}
"#;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TodayFile {
    pub path: String,
    pub name: String,
    pub modified_ms: u64,
}

pub fn default_workspace_root() -> PathBuf {
    if let Some(docs) = dirs::document_dir() {
        docs.join("PSCode")
    } else {
        dirs::home_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("PSCode")
    }
}

pub fn today_folder(workspace_root: &str) -> PathBuf {
    let date = Local::now().format("%Y-%m-%d").to_string();
    PathBuf::from(workspace_root)
        .join("projects")
        .join(date)
}

pub fn sanitize_filename(name: &str) -> String {
    let lower = name.to_lowercase();
    let tokens: Vec<&str> = lower.split_whitespace().collect();

    // Try to extract first word and first number for "word_1234" style
    let first_word: String = tokens
        .first()
        .map(|t| {
            t.chars()
                .filter(|c| c.is_alphanumeric())
                .collect()
        })
        .unwrap_or_default();

    let number: String = tokens
        .iter()
        .find_map(|t| {
            let digits: String = t.chars().filter(|c| c.is_ascii_digit()).collect();
            if !digits.is_empty() {
                Some(digits)
            } else {
                None
            }
        })
        .unwrap_or_default();

    let base = if !first_word.is_empty() && !number.is_empty() {
        format!("{}_{}", first_word, number)
    } else {
        let sanitized: String = lower
            .chars()
            .map(|c| {
                if c.is_alphanumeric() {
                    c
                } else {
                    '_'
                }
            })
            .collect();
        let mut result = String::new();
        let mut prev_underscore = false;
        for c in sanitized.chars() {
            if c == '_' {
                if !prev_underscore && !result.is_empty() {
                    result.push('_');
                    prev_underscore = true;
                }
            } else {
                result.push(c);
                prev_underscore = false;
            }
        }
        result.trim_matches('_').to_string()
    };

    if base.is_empty() {
        "untitled".to_string()
    } else if base.ends_with(".cpp") {
        base
    } else {
        format!("{}.cpp", base)
    }
}

#[tauri::command]
pub fn ensure_workspace(workspace_root: String) -> Result<String, String> {
    let root = if workspace_root.is_empty() {
        default_workspace_root()
    } else {
        PathBuf::from(workspace_root)
    };

    fs::create_dir_all(&root).map_err(|e| e.to_string())?;
    fs::create_dir_all(today_folder(root.to_str().unwrap_or(""))).map_err(|e| e.to_string())?;

    Ok(root.to_string_lossy().to_string())
}

#[tauri::command]
pub fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
pub fn write_file(path: String, content: String) -> Result<(), String> {
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&path, content).map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
pub fn list_today_files(workspace_root: String) -> Result<Vec<TodayFile>, String> {
    let folder = today_folder(&workspace_root);
    if !folder.exists() {
        return Ok(Vec::new());
    }

    let mut files = Vec::new();
    let entries = fs::read_dir(&folder).map_err(|e| e.to_string())?;

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("cpp") {
            continue;
        }
        let meta = entry.metadata().map_err(|e| e.to_string())?;
        let modified_ms = meta
            .modified()
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0);

        files.push(TodayFile {
            name: path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown")
                .to_string(),
            path: path.to_string_lossy().to_string(),
            modified_ms,
        });
    }

    files.sort_by(|a, b| b.modified_ms.cmp(&a.modified_ms));
    Ok(files)
}

#[tauri::command]
pub fn create_problem_file(
    workspace_root: String,
    problem_name: String,
    template: Option<String>,
) -> Result<String, String> {
    let root = if workspace_root.is_empty() {
        default_workspace_root()
    } else {
        PathBuf::from(workspace_root)
    };

    let folder = today_folder(root.to_str().unwrap_or(""));
    fs::create_dir_all(&folder).map_err(|e| e.to_string())?;

    let filename = sanitize_filename(&problem_name);
    let file_path = folder.join(&filename);

    if file_path.exists() {
        return Err(format!("File already exists: {}", filename));
    }

    let content = template.unwrap_or_else(|| DEFAULT_TEMPLATE.to_string());
    fs::write(&file_path, content).map_err(|e| e.to_string())?;

    Ok(file_path.to_string_lossy().to_string())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileEntry {
    pub path: String,
    pub name: String,
    pub is_dir: bool,
    pub children: Option<Vec<FileEntry>>,
}

fn list_dir_helper(path: &Path) -> Result<Vec<FileEntry>, String> {
    let mut entries = Vec::new();
    if !path.exists() || !path.is_dir() {
        return Ok(entries);
    }

    let dir_entries = fs::read_dir(path).map_err(|e| e.to_string())?;
    for entry in dir_entries.flatten() {
        let entry_path = entry.path();
        let name = entry_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string();

        // Ignore hidden files/folders and specific system/build dirs
        if name.starts_with('.') || name == "node_modules" || name == "target" || name == "dist" || name == "build" {
            continue;
        }

        let is_dir = entry_path.is_dir();
        let children = if is_dir {
            Some(list_dir_helper(&entry_path)?)
        } else {
            None
        };

        entries.push(FileEntry {
            path: entry_path.to_string_lossy().to_string(),
            name,
            is_dir,
            children,
        });
    }

    // Sort: directories first, then alphabetically
    entries.sort_by(|a, b| {
        if a.is_dir != b.is_dir {
            b.is_dir.cmp(&a.is_dir)
        } else {
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        }
    });

    Ok(entries)
}

#[tauri::command]
pub fn list_directory_recursive(workspace_root: String) -> Result<Vec<FileEntry>, String> {
    let root = if workspace_root.is_empty() {
        default_workspace_root()
    } else {
        PathBuf::from(workspace_root)
    };

    if !root.exists() {
        fs::create_dir_all(&root).map_err(|e| e.to_string())?;
    }

    list_dir_helper(&root)
}

#[tauri::command]
pub fn create_file(path: String) -> Result<(), String> {
    let file_path = Path::new(&path);
    if file_path.exists() {
        return Err("File already exists".to_string());
    }
    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    // Write default template if it is a C++ file
    let content = if file_path.extension().and_then(|e| e.to_str()) == Some("cpp") {
        DEFAULT_TEMPLATE.to_string()
    } else {
        String::new()
    };

    fs::write(file_path, content).map_err(|e| format!("Failed to create file: {}", e))
}

#[tauri::command]
pub fn create_directory(path: String) -> Result<(), String> {
    let dir_path = Path::new(&path);
    if dir_path.exists() {
        return Err("Directory already exists".to_string());
    }
    fs::create_dir_all(dir_path).map_err(|e| format!("Failed to create directory: {}", e))
}

#[tauri::command]
pub fn rename_item(old_path: String, new_path: String) -> Result<(), String> {
    let src = Path::new(&old_path);
    let dst = Path::new(&new_path);
    if dst.exists() {
        return Err("Destination already exists".to_string());
    }
    fs::rename(src, dst).map_err(|e| format!("Failed to rename: {}", e))
}

#[tauri::command]
pub fn delete_item(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err("Path does not exist".to_string());
    }
    if p.is_dir() {
        fs::remove_dir_all(p).map_err(|e| format!("Failed to delete directory: {}", e))
    } else {
        fs::remove_file(p).map_err(|e| format!("Failed to delete file: {}", e))
    }
}

#[tauri::command]
pub fn git_push(workspace_root: String, git_url: String) -> Result<String, String> {
    use std::process::Command;

    let root_path = std::path::Path::new(&workspace_root);
    if !root_path.exists() {
        return Err("Workspace root does not exist".to_string());
    }

    // 1. Initialize git if not already initialized
    let git_dir = root_path.join(".git");
    if !git_dir.exists() {
        let init_output = Command::new("git")
            .arg("init")
            .current_dir(root_path)
            .output()
            .map_err(|e| format!("Failed to run git init: {}", e))?;
        if !init_output.status.success() {
            return Err(format!(
                "git init failed: {}",
                String::from_utf8_lossy(&init_output.stderr)
            ));
        }
    }

    // 2. Set remote origin url if git_url is not empty
    if !git_url.trim().is_empty() {
        // Try to remove existing origin
        let _ = Command::new("git")
            .args(&["remote", "remove", "origin"])
            .current_dir(root_path)
            .output();

        // Add remote origin
        let remote_output = Command::new("git")
            .args(&["remote", "add", "origin", git_url.trim()])
            .current_dir(root_path)
            .output()
            .map_err(|e| format!("Failed to set git remote: {}", e))?;
        if !remote_output.status.success() {
            return Err(format!(
                "Failed to set git remote: {}",
                String::from_utf8_lossy(&remote_output.stderr)
            ));
        }
    }

    // 3. Git add .
    let add_output = Command::new("git")
        .args(&["add", "."])
        .current_dir(root_path)
        .output()
        .map_err(|e| format!("Failed to stage files: {}", e))?;
    if !add_output.status.success() {
        return Err(format!(
            "git add failed: {}",
            String::from_utf8_lossy(&add_output.stderr)
        ));
    }

    // 4. Git commit
    let commit_msg = format!("Solve problem: {}", chrono::Local::now().format("%Y-%m-%d %H:%M:%S"));
    let _commit_output = Command::new("git")
        .args(&["commit", "-m", &commit_msg])
        .current_dir(root_path)
        .output()
        .map_err(|e| format!("Failed to commit: {}", e))?;

    // 5. Git push -u origin main
    if !git_url.trim().is_empty() {
        // Try push main, if that fails, try master or current branch
        let push_output = Command::new("git")
            .args(&["push", "-u", "origin", "main"])
            .current_dir(root_path)
            .output()
            .map_err(|e| format!("Failed to push to main: {}", e))?;
        
        if !push_output.status.success() {
            // Try master
            let push_master = Command::new("git")
                .args(&["push", "-u", "origin", "master"])
                .current_dir(root_path)
                .output()
                .map_err(|e| format!("Failed to push to master: {}", e))?;
            
            if !push_master.status.success() {
                // Just try push
                let push_default = Command::new("git")
                    .args(&["push", "origin"])
                    .current_dir(root_path)
                    .output()
                    .map_err(|e| format!("Failed to push default: {}", e))?;
                
                if !push_default.status.success() {
                    return Err(format!(
                        "git push failed: {}",
                        String::from_utf8_lossy(&push_default.stderr)
                    ));
                }
            }
        }
    }

    let status_str = if git_url.trim().is_empty() {
        "Committed locally (No Git URL configured)".to_string()
    } else {
        format!("Successfully committed and pushed to remote origin! ({})", commit_msg)
    };

    Ok(status_str)
}
