//! Favicon fetching for project logos.
//!
//! External-service layer, kept out of `repositories` (which is SQL-only).
//! We resolve a site's favicon through Google's favicon service rather than
//! parsing the page, then download the bytes into the app-data dir so logos
//! render offline (the app is local-first). `parse_domain` is pure and is
//! covered by the tests below; `download` is not unit-tested since the test
//! suite runs without network access (same convention as `github.rs`).

use tauri::{AppHandle, Manager};

use crate::error::{AppError, Result};

const FAVICON_SERVICE: &str = "https://www.google.com/s2/favicons";
const USER_AGENT: &str = "monica-app";

/// Extract the host from a site URL for the favicon-service query. Accepts
/// `https://`, `http://` and bare hosts, ignores any path, and strips optional
/// `user@` credentials and `:port`.
pub fn parse_domain(url: &str) -> Result<String> {
    let trimmed = url.trim();
    let rest = trimmed
        .strip_prefix("https://")
        .or_else(|| trimmed.strip_prefix("http://"))
        .unwrap_or(trimmed);

    let authority = rest.split('/').next().unwrap_or("");
    // Drop any `user:pass@` prefix, then any `:port` suffix.
    let host = authority.rsplit('@').next().unwrap_or(authority);
    let host = host.split(':').next().unwrap_or(host).trim();

    if host.is_empty() || !host.contains('.') {
        return Err(AppError::Validation(format!("not a valid URL host: {url}")));
    }
    Ok(host.to_string())
}

/// Download the favicon for `url` into `<app_data>/logos/<project_id>.png`,
/// returning the absolute file path. The fixed file name means a re-fetch
/// overwrites the previous icon instead of leaving orphans.
pub async fn download(app: &AppHandle, project_id: &str, url: &str) -> Result<String> {
    let domain = parse_domain(url)?;
    let service_url = format!("{FAVICON_SERVICE}?domain={domain}&sz=128");

    let client = reqwest::Client::builder().user_agent(USER_AGENT).build()?;
    let bytes = client
        .get(service_url)
        .send()
        .await?
        .error_for_status()?
        .bytes()
        .await?;

    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Io(e.to_string()))?
        .join("logos");
    std::fs::create_dir_all(&dir)?;

    let path = dir.join(format!("{project_id}.png"));
    std::fs::write(&path, &bytes)?;

    Ok(path.to_string_lossy().to_string())
}

/// Best-effort delete of a project's downloaded favicon. Errors (e.g. the file
/// never existed) are ignored by the caller.
pub fn remove(app: &AppHandle, project_id: &str) -> Result<()> {
    let path = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Io(e.to_string()))?
        .join("logos")
        .join(format!("{project_id}.png"));
    if path.exists() {
        std::fs::remove_file(&path)?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_https_and_http() {
        assert_eq!(parse_domain("https://example.com").unwrap(), "example.com");
        assert_eq!(parse_domain("http://example.com").unwrap(), "example.com");
    }

    #[test]
    fn parse_bare_host_and_path() {
        assert_eq!(parse_domain("example.com").unwrap(), "example.com");
        assert_eq!(
            parse_domain("https://example.com/some/path?q=1").unwrap(),
            "example.com"
        );
    }

    #[test]
    fn parse_strips_port_and_userinfo() {
        assert_eq!(
            parse_domain("https://user:pass@example.com:8443/x").unwrap(),
            "example.com"
        );
        assert_eq!(parse_domain("  https://sub.example.com  ").unwrap(), "sub.example.com");
    }

    #[test]
    fn parse_rejects_invalid() {
        assert!(matches!(parse_domain(""), Err(AppError::Validation(_))));
        assert!(matches!(parse_domain("localhost"), Err(AppError::Validation(_))));
        assert!(matches!(
            parse_domain("https://localhost/x"),
            Err(AppError::Validation(_))
        ));
    }
}
