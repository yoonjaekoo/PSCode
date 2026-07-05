mod commands;

use commands::{
    compile_and_run, create_problem_file, detect_compiler, ensure_workspace, get_settings,
    git_push, git_pull, install_compiler, list_today_files, online_compile_and_run, read_file, save_settings,
    write_file, list_directory_recursive, create_file, create_directory, rename_item, delete_item,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            compile_and_run,
            online_compile_and_run,
            detect_compiler,
            install_compiler,
            read_file,
            write_file,
            list_today_files,
            create_problem_file,
            ensure_workspace,
            get_settings,
            save_settings,
            list_directory_recursive,
            create_file,
            create_directory,
            rename_item,
            delete_item,
            git_push,
            git_pull,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
