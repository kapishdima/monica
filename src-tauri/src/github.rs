//! GitHub REST API integration (unauthenticated).
//!
//! External-service layer, kept out of `repositories` (which is SQL-only).
//! Counts come from the search API (which, unlike `open_issues_count`, separates
//! pull requests from issues). The network functions (`fetch_stats` /
//! `fetch_activity`) are not unit-tested since the test suite runs without
//! network access; `parse_repo` is pure and is covered by the tests below.

use serde::{Deserialize, Serialize};

use crate::error::{AppError, Result};

const API_BASE: &str = "https://api.github.com";
const USER_AGENT: &str = "monica-app";

/// Aggregate counts persisted on a project and shown on its card.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GithubStats {
    pub stars: i64,
    pub prs: i64,
    pub issues: i64,
}

/// Repository metadata used to pre-fill the project form when importing from a
/// GitHub URL (not persisted directly; the frontend maps it into `NewProject`).
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GithubRepo {
    pub name: String,
    pub description: Option<String>,
    /// The repository's homepage, if it declares one.
    pub url: Option<String>,
    pub stars: i64,
    pub prs: i64,
    pub issues: i64,
}

/// A single pull request or issue, for the project detail tabs.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GithubItem {
    pub number: i64,
    pub title: String,
    pub html_url: String,
    pub state: String,
    pub author: Option<String>,
}

/// Live open pull requests and issues for a repository (not persisted).
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GithubActivity {
    pub prs: Vec<GithubItem>,
    pub issues: Vec<GithubItem>,
}

// --- GitHub API response shapes (only the fields we consume) ---

#[derive(Deserialize)]
struct RepoResponse {
    name: String,
    #[serde(default)]
    description: Option<String>,
    #[serde(default)]
    homepage: Option<String>,
    stargazers_count: i64,
}

#[derive(Deserialize)]
struct SearchResponse {
    total_count: i64,
}

#[derive(Deserialize)]
struct User {
    login: String,
}

#[derive(Deserialize)]
struct IssueOrPr {
    number: i64,
    title: String,
    html_url: String,
    state: String,
    #[serde(default)]
    user: Option<User>,
    /// Present on items returned by the issues endpoint that are actually PRs.
    #[serde(default)]
    pull_request: Option<serde_json::Value>,
}

impl From<IssueOrPr> for GithubItem {
    fn from(i: IssueOrPr) -> Self {
        GithubItem {
            number: i.number,
            title: i.title,
            html_url: i.html_url,
            state: i.state,
            author: i.user.map(|u| u.login),
        }
    }
}

/// Extract `(owner, repo)` from a GitHub repository URL. Accepts `https://`,
/// `http://` and bare `github.com/...`, an optional trailing path, and a
/// `.git` suffix.
pub fn parse_repo(url: &str) -> Result<(String, String)> {
    let trimmed = url.trim();
    let rest = trimmed
        .strip_prefix("https://github.com/")
        .or_else(|| trimmed.strip_prefix("http://github.com/"))
        .or_else(|| trimmed.strip_prefix("github.com/"))
        .ok_or_else(|| AppError::Validation(format!("not a GitHub URL: {url}")))?;

    let mut parts = rest.trim_matches('/').split('/');
    let owner = parts.next().filter(|s| !s.is_empty());
    let repo = parts.next().filter(|s| !s.is_empty());

    match (owner, repo) {
        (Some(owner), Some(repo)) => {
            let repo = repo.strip_suffix(".git").unwrap_or(repo);
            Ok((owner.to_string(), repo.to_string()))
        }
        _ => Err(AppError::Validation(format!(
            "GitHub URL must be https://github.com/<owner>/<repo>: {url}"
        ))),
    }
}

fn client() -> Result<reqwest::Client> {
    Ok(reqwest::Client::builder().user_agent(USER_AGENT).build()?)
}

/// Fetch star, open-PR and open-issue counts for a repository.
pub async fn fetch_stats(url: &str) -> Result<GithubStats> {
    let (owner, repo) = parse_repo(url)?;
    let client = client()?;

    let repo_resp: RepoResponse = client
        .get(format!("{API_BASE}/repos/{owner}/{repo}"))
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;

    let prs = search_count(&client, &owner, &repo, "pr").await?;
    let issues = search_count(&client, &owner, &repo, "issue").await?;

    Ok(GithubStats {
        stars: repo_resp.stargazers_count,
        prs,
        issues,
    })
}

/// Fetch repository metadata (name, description, homepage) along with the same
/// open-PR/issue counts as `fetch_stats`, for pre-filling the project form on
/// import.
pub async fn fetch_repo(url: &str) -> Result<GithubRepo> {
    let (owner, repo) = parse_repo(url)?;
    let client = client()?;

    let repo_resp: RepoResponse = client
        .get(format!("{API_BASE}/repos/{owner}/{repo}"))
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;

    let prs = search_count(&client, &owner, &repo, "pr").await?;
    let issues = search_count(&client, &owner, &repo, "issue").await?;

    Ok(GithubRepo {
        name: repo_resp.name,
        description: blank_to_none(repo_resp.description),
        url: blank_to_none(repo_resp.homepage),
        stars: repo_resp.stargazers_count,
        prs,
        issues,
    })
}

/// GitHub returns an empty string (not null) for an absent homepage or
/// description; collapse blank/whitespace values to `None`.
fn blank_to_none(s: Option<String>) -> Option<String> {
    s.map(|s| s.trim().to_string()).filter(|s| !s.is_empty())
}

/// Count open items of a given `kind` (`"pr"` or `"issue"`) via the search API.
async fn search_count(
    client: &reqwest::Client,
    owner: &str,
    repo: &str,
    kind: &str,
) -> Result<i64> {
    let q = format!("repo:{owner}/{repo} type:{kind} state:open");
    let resp: SearchResponse = client
        .get(format!("{API_BASE}/search/issues"))
        .query(&[("q", q.as_str()), ("per_page", "1")])
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;
    Ok(resp.total_count)
}

/// Fetch live open pull requests and issues for the detail page.
pub async fn fetch_activity(url: &str) -> Result<GithubActivity> {
    let (owner, repo) = parse_repo(url)?;
    let client = client()?;

    let prs_raw: Vec<IssueOrPr> = client
        .get(format!("{API_BASE}/repos/{owner}/{repo}/pulls"))
        .query(&[("state", "open"), ("per_page", "30")])
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;

    let issues_raw: Vec<IssueOrPr> = client
        .get(format!("{API_BASE}/repos/{owner}/{repo}/issues"))
        .query(&[("state", "open"), ("per_page", "30")])
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;

    let prs = prs_raw.into_iter().map(Into::into).collect();
    // The issues endpoint also returns PRs; drop those.
    let issues = issues_raw
        .into_iter()
        .filter(|i| i.pull_request.is_none())
        .map(Into::into)
        .collect();

    Ok(GithubActivity { prs, issues })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_plain_url() {
        let (owner, repo) = parse_repo("https://github.com/owner/repo").unwrap();
        assert_eq!(owner, "owner");
        assert_eq!(repo, "repo");
    }

    #[test]
    fn parse_trailing_slash_and_extra_path() {
        let (o, r) = parse_repo("https://github.com/owner/repo/").unwrap();
        assert_eq!((o.as_str(), r.as_str()), ("owner", "repo"));
        let (o, r) = parse_repo("https://github.com/owner/repo/issues").unwrap();
        assert_eq!((o.as_str(), r.as_str()), ("owner", "repo"));
    }

    #[test]
    fn parse_strips_git_suffix_and_bare_host() {
        let (o, r) = parse_repo("github.com/owner/repo.git").unwrap();
        assert_eq!((o.as_str(), r.as_str()), ("owner", "repo"));
    }

    #[test]
    fn blank_to_none_collapses_empty_and_whitespace() {
        assert_eq!(blank_to_none(Some("".into())), None);
        assert_eq!(blank_to_none(Some("   ".into())), None);
        assert_eq!(blank_to_none(None), None);
        assert_eq!(blank_to_none(Some("  hi ".into())), Some("hi".into()));
    }

    #[test]
    fn parse_rejects_invalid() {
        assert!(matches!(
            parse_repo("https://gitlab.com/owner/repo"),
            Err(AppError::Validation(_))
        ));
        assert!(matches!(
            parse_repo("https://github.com/owner"),
            Err(AppError::Validation(_))
        ));
    }
}
