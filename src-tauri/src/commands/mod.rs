pub mod compile;
pub mod compiler_detect;
pub mod fs_ops;
pub mod online_compile;
pub mod settings;

pub use compile::compile_and_run;
pub use compiler_detect::{detect_compiler, install_compiler};
pub use online_compile::online_compile_and_run;
pub use fs_ops::{
    create_problem_file, ensure_workspace, list_today_files, read_file, write_file,
    list_directory_recursive, create_file, create_directory, rename_item, delete_item,
    git_push,
};
pub use settings::{get_settings, save_settings};
