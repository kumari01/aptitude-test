/**
 * Cross-browser Fullscreen API helpers.
 *
 * These wrappers handle vendor-prefixed methods so the rest of the
 * application can call a single, clean API.
 */

/**
 * Request the browser to enter fullscreen mode for the given element.
 * Defaults to the document's root element (<html>).
 *
 * @param {HTMLElement} [element=document.documentElement] - Element to make fullscreen.
 * @returns {Promise<void>} Resolves when fullscreen is active, rejects on failure.
 */
export function requestFullscreen(element = document.documentElement) {
  if (!element) {
    return Promise.reject(new Error("No element provided for fullscreen request"));
  }

  const methods = [
    "requestFullscreen",
    "webkitRequestFullscreen",
    "mozRequestFullScreen",
    "msRequestFullscreen",
  ];

  for (const method of methods) {
    if (element[method]) {
      return Promise.resolve(element[method].call(element));
    }
  }

  return Promise.reject(new Error("Fullscreen API is not supported by this browser"));
}

/**
 * Exit the current fullscreen session.
 *
 * @returns {Promise<void>} Resolves when fullscreen is exited, rejects on failure.
 */
export function exitFullscreen() {
  const doc = window.document;

  const methods = [
    "exitFullscreen",
    "webkitExitFullscreen",
    "mozCancelFullScreen",
    "msExitFullscreen",
  ];

  for (const method of methods) {
    if (doc[method]) {
      return Promise.resolve(doc[method].call(doc));
    }
  }

  return Promise.reject(new Error("Fullscreen API is not supported by this browser"));
}

/**
 * Check whether the document is currently in fullscreen mode.
 *
 * @returns {boolean} True if fullscreen is active.
 */
export function isFullscreen() {
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement ||
    false
  );
}
