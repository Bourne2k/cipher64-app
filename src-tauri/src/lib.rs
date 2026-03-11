#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod app;
mod chess;
mod db;
mod error;
mod fide;
mod fs;
mod lexer;
mod oauth;
mod opening;
mod package_manager;
mod pgn;
mod puzzle;
mod sound;
// --- NEW CIPHER64 MODULES ---
mod auth; 
// mod coach; // Enable this once you create the coach directory in Phase 4

use std::sync::{Arc, Mutex};
use dashmap::DashMap;
use derivative::Derivative;
use sysinfo::SystemExt;
use tauri::AppHandle;
use tokio::sync::{RwLock, Semaphore};

// Existing imports
use chess::{BestMovesPayload, EngineProcess, ReportProgress};
use db::{DatabaseProgress, GameQueryJs, NormalizedGame, PositionStats};
use fide::FidePlayer;
use oauth::AuthState;

#[cfg(all(debug_assertions, not(target_os = "android")))]
use specta_typescript::{BigIntExportBehavior, Typescript};

use crate::chess::{
    get_best_moves, analyze_game, get_engine_config, get_engine_logs, kill_engine, kill_engines, stop_engine
};
use crate::db::{
    clear_games, convert_pgn, create_indexes, delete_database, delete_db_game, delete_empty_games,
    delete_indexes, export_to_pgn, get_player, get_players_game_info, get_tournaments,
    search_position,
};
use crate::fide::{download_fide_db, find_fide_player};
use crate::fs::{set_file_as_executable, DownloadProgress};
use crate::lexer::lex_pgn;
use crate::oauth::authenticate;
use crate::package_manager::{
    check_package_installed, check_package_manager_available, find_executable_path, install_package,
};
use crate::pgn::{count_pgn_games, delete_game, read_games, write_game};
use crate::puzzle::{get_puzzle, get_puzzle_db_info, get_puzzle_rating_range, import_puzzle_file};
use crate::sound::get_sound_server_port;
use crate::{
    db::{
        delete_duplicated_games, edit_db_info, get_db_info, get_games, get_game, get_players, merge_players, update_game
    },
    fs::{download_file, file_exists, get_file_metadata},
    opening::{get_opening_from_fen, get_opening_from_name, search_opening_name},
};

pub type GameData = (i32, i32, i32, Option<String>, Option<String>, Vec<u8>, Option<String>, i32, i32, i32);

#[derive(Derivative)]
#[derivative(Default)]
pub struct AppState {
    connection_pool: DashMap<String, diesel::r2d2::Pool<diesel::r2d2::ConnectionManager<diesel::SqliteConnection>>>,
    #[derivative(Default(value = "Mutex::new(lru::LruCache::new(std::num::NonZeroUsize::new(100).unwrap()))"))]
    line_cache: Mutex<lru::LruCache<(GameQueryJs, std::path::PathBuf), (Vec<PositionStats>, Vec<NormalizedGame>)>>,
    db_cache: Mutex<Vec<GameData>>,
    #[derivative(Default(value = "Arc::new(Semaphore::new(2))"))]
    new_request: Arc<Semaphore>,
    pgn_offsets: DashMap<String, Vec<u64>>,
    fide_players: RwLock<Vec<FidePlayer>>,
    engine_processes: DashMap<(String, String), Arc<tokio::sync::Mutex<EngineProcess>>>,
    auth: AuthState,
}

// ============================================================================
// CIPHER64 NEW COMMANDS
// ============================================================================

#[tauri::command]
#[specta::specta]
fn verify_license(jwt: String) -> Result<bool, String> {
    // Validates the Ed25519 JWT signature and "premium" plan status
    match auth::gatekeeper::verify_premium_access(&jwt) {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("{:?}", e)),
    }
}

#[tauri::command]
#[specta::specta]
async fn get_coach_explanation(fen: String, move_san: String, jwt: String) -> Result<String, String> {
    // 1. Premium Gatekeeper check
    auth::gatekeeper::verify_premium_access(&jwt).map_err(|e| format!("Access Denied: {:?}", e))?;

    // 2. Logic placeholder: In Phase 4 we will integrate the full Rust analysis pipeline
    Ok(format!("Coach analysis for {} is coming in Phase 4.", move_san))
}

#[tauri::command]
#[specta::specta]
async fn refresh_jwt(current_jwt: String) -> Result<String, String> {
    // This will call the Next.js /api/refresh endpoint in Phase 6
    Ok(current_jwt) 
}

// ============================================================================
// MAIN APPLICATION ENTRY POINT
// ============================================================================

#[tokio::main]
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() {
    let specta_builder = tauri_specta::Builder::new()
        .commands(tauri_specta::collect_commands!(
            // --- Cipher64 New ---
            verify_license,
            get_coach_explanation,
            refresh_jwt,
            // --- Original Pawn Appetit ---
            app::platform::screen_capture,
            find_fide_player,
            get_best_moves,
            analyze_game,
            stop_engine,
            kill_engine,
            kill_engines,
            get_engine_logs,
            memory_size,
            get_puzzle,
            search_opening_name,
            get_opening_from_fen,
            get_opening_from_name,
            get_players_game_info,
            get_engine_config,
            file_exists,
            get_file_metadata,
            merge_players,
            convert_pgn,
            get_player,
            count_pgn_games,
            read_games,
            lex_pgn,
            is_bmi2_compatible,
            delete_game,
            delete_duplicated_games,
            delete_empty_games,
            clear_games,
            set_file_as_executable,
            delete_indexes,
            create_indexes,
            edit_db_info,
            delete_db_game,
            delete_database,
            export_to_pgn,
            authenticate,
            write_game,
            download_fide_db,
            download_file,
            get_tournaments,
            get_db_info,
            get_games,
            get_game,
            update_game,
            search_position,
            get_players,
            get_puzzle_db_info,
            get_puzzle_rating_range,
            import_puzzle_file,
            check_package_manager_available,
            install_package,
            check_package_installed,
            find_executable_path,
            open_external_link,
            get_sound_server_port
        ))
        .events(tauri_specta::collect_events!(
            BestMovesPayload,
            DatabaseProgress,
            DownloadProgress,
            ReportProgress
        ));

    #[cfg(all(debug_assertions, not(target_os = "android")))]
    specta_builder
        .export(
            Typescript::default().bigint(BigIntExportBehavior::BigInt),
            "../src/bindings/generated.ts",
        )
        .expect("Failed to export types");

    let builder = tauri::Builder::default();    
    let builder = app::platform::setup_tauri_plugins(builder, &specta_builder);
    
    builder
        .setup(move |app| {
            app::setup::setup_tauri_app(app, &specta_builder)
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// ============================================================================
// SHARED COMMANDS
// ============================================================================

#[tauri::command]
#[specta::specta]
fn is_bmi2_compatible() -> bool {
    #[cfg(any(target_arch = "x86", target_arch = "x86_64"))]
    if is_x86_feature_detected!("bmi2") {
        return true;
    }
    false
}

#[tauri::command]
#[specta::specta]
fn memory_size() -> u64 {
    sysinfo::System::new_all().total_memory() / (1024 * 1024)
}

#[tauri::command]
#[specta::specta]
async fn open_external_link(app: AppHandle, url: String) -> Result<(), String> {
    tauri_plugin_opener::OpenerExt::opener(&app)
        .open_url(url, None::<String>)
        .map_err(|e| format!("Failed to open external link: {}", e))
}