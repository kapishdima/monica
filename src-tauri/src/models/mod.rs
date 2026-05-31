pub mod project;
pub mod task;

use time::format_description::well_known::Rfc3339;
use time::OffsetDateTime;

/// Current UTC time as an ISO-8601 (RFC 3339) string for `created_at`/`updated_at`.
pub fn now_timestamp() -> String {
    OffsetDateTime::now_utc()
        .format(&Rfc3339)
        .expect("Rfc3339 formatting cannot fail")
}
