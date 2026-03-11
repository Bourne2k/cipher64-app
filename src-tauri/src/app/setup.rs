use tauri::{App, Manager}; // <-- Add Manager trait here

use crate::app::platform;

pub fn setup_tauri_app(
    app: &App,
    specta_builder: &tauri_specta::Builder,
) -> Result<(), Box<dyn std::error::Error>> {
    log::info!("Setting up tauri application");

    platform::init_platform(app)?;

    specta_builder.mount_events(app);

    // --- FORCE WINDOW VISIBILITY ---
    if let Some(window) = app.get_webview_window("main") {
        window.show().unwrap();
        window.set_focus().unwrap();
    }

    let _ = log::info!("Finished tauri application initialization");
    Ok(())
}