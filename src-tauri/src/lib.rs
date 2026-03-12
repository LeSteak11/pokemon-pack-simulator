use std::fs;
use tauri::Manager;

/// Reads a set JSON file from the sets/ folder in the app's resource directory.
/// This folder lives alongside the .exe and can be updated without rebuilding the app.
#[tauri::command]
fn read_set_file(app: tauri::AppHandle, filename: String) -> Result<String, String> {
    let path = app.path()
        .resource_dir()
        .map_err(|e| e.to_string())?
        .join("sets")
        .join(&filename);

    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read {}: {}", path.display(), e))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![read_set_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
