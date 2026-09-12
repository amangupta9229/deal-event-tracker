export const DEMO_PASSWORD = "password"
export const SESSION_STORAGE_KEY = "det-session-user-id"
export const SESSION_STARTED_KEY = "det-session-started-at"
export const SESSION_ACTIVITY_KEY = "det-session-last-activity"
/** Sign out after this much time with no clicks/keys. */
export const SESSION_IDLE_MS = 30 * 60 * 1000
/** Sign out even if the tab stays active. */
export const SESSION_MAX_MS = 8 * 60 * 60 * 1000
