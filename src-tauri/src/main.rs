#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    pawn_appetit_lib::run();
}
mod auth;

#[tauri::command]
fn verify_license(jwt: String) -> Result<bool, String> {
    match auth::gatekeeper::verify_premium_access(&jwt) {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("{:?}", e)),
    }
}

// Gated command example
#[tauri::command]
fn get_coach_explanation(fen: String, move_san: String, jwt: String) -> Result<String, String> {
    // 1. Gatekeeper check
    auth::gatekeeper::verify_premium_access(&jwt).map_err(|e| format!("Access Denied: {:?}", e))?;

    // 2. Pass to Coach pipeline (to be built in Phase 2)
    // coach::analyze_move(&fen, &move_san)
    Ok(format!("Coach says: The move {} from FEN {} is a premium analysis.", move_san, fen))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            verify_license,
            get_coach_explanation,
            // ... include all existing pawnappetit commands here
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}