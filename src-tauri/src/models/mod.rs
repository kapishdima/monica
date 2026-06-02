pub mod daily_plan;
pub mod project;
pub mod settings;
pub mod task;

use time::format_description::well_known::Rfc3339;
use time::macros::format_description;
use time::OffsetDateTime;

/// Current UTC time as an ISO-8601 (RFC 3339) string for `created_at`/`updated_at`.
pub fn now_timestamp() -> String {
    OffsetDateTime::now_utc()
        .format(&Rfc3339)
        .expect("Rfc3339 formatting cannot fail")
}

/// Today's local calendar date as `YYYY-MM-DD`, used to link tasks/plans to a
/// day. Falls back to UTC if the platform can't determine the local offset
/// (`time`'s `now_local` errors in some sandboxed environments).
pub fn local_today() -> String {
    let now = OffsetDateTime::now_local().unwrap_or_else(|_| OffsetDateTime::now_utc());
    let fmt = format_description!("[year]-[month]-[day]");
    now.format(&fmt).expect("date formatting cannot fail")
}

/// Current local time as `HH:MM`, compared against the reminder time each tick.
pub fn local_hm() -> String {
    let now = OffsetDateTime::now_local().unwrap_or_else(|_| OffsetDateTime::now_utc());
    let fmt = format_description!("[hour]:[minute]");
    now.format(&fmt).expect("time formatting cannot fail")
}

