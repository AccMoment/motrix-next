/** @fileoverview Mapping of aria2 download error codes to i18n keys for user-facing notifications. */

/**
 * Maps aria2 errorCode values to i18n translation keys under the `task` namespace.
 * Unknown codes fall back to displaying aria2's raw errorMessage.
 *
 * @see https://aria2.github.io/manual/en/html/aria2c.html#exit-status
 */
export const ARIA2_ERROR_CODES: Record<string, string> = {
  '1': 'task.error-unknown',
  '2': 'task.error-timeout',
  '3': 'task.error-not-found',
  '4': 'task.error-too-many-redirects',
  '5': 'task.error-disk-full',
  '6': 'task.error-network',
  '7': 'task.error-duplicate',
  '8': 'task.error-resume-failed',
  '9': 'task.error-file-not-found',
  '13': 'task.error-file-exists',
  '19': 'task.error-io',
  '24': 'task.error-checksum',
}
