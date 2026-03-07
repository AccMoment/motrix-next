/** @fileoverview Named timing constants eliminating magic numbers throughout the codebase. */

/** Polling interval for refreshing the active task list (ms). */
export const TASK_POLLING_INTERVAL = 1000

/** Base interval for global stat refresh (ms). */
export const STAT_BASE_INTERVAL = 1000

/** Additional per-active-task stat interval increment (ms). */
export const STAT_PER_TASK_INTERVAL = 100

/** Minimum stat refresh interval cap (ms). */
export const STAT_MIN_INTERVAL = 500

/** Maximum stat refresh interval cap (ms). */
export const STAT_MAX_INTERVAL = 6000

/** Delay before showing the loading spinner in the add-task dialog (ms). */
export const ADD_TASK_LOADING_DELAY = 300

/** Default timeout for file operation retries (ms). */
export const FILE_OP_TIMEOUT = 5000

/** Engine health-check retry interval (ms). */
export const ENGINE_RETRY_INTERVAL = 500

/** Maximum number of engine health-check retries before giving up. */
export const ENGINE_MAX_RETRIES = 10
