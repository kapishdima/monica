#[derive(Debug, thiserror::Error, serde::Serialize)]
#[serde(tag = "kind", content = "message")]
pub enum AppError {
    #[error("database error: {0}")]
    Database(String),
    #[error("not found")]
    NotFound,
    #[error("invalid input: {0}")]
    Validation(String),
    #[error("io error: {0}")]
    Io(String),
    #[error("network error: {0}")]
    Network(String),
}

impl From<sqlx::Error> for AppError {
    fn from(e: sqlx::Error) -> Self {
        match e {
            sqlx::Error::RowNotFound => AppError::NotFound,
            other => AppError::Database(other.to_string()),
        }
    }
}

impl From<reqwest::Error> for AppError {
    fn from(e: reqwest::Error) -> Self {
        AppError::Network(e.to_string())
    }
}

impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self {
        AppError::Io(e.to_string())
    }
}

impl From<tauri::Error> for AppError {
    fn from(e: tauri::Error) -> Self {
        AppError::Io(e.to_string())
    }
}

pub type Result<T> = std::result::Result<T, AppError>;
