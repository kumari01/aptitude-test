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
export function requestFullscreen(element) {
  const target = element || document.documentElement || document.body;
  if (!target) {
    return Promise.reject(new Error("No element provided for fullscreen request"));
  }

  const methods = [
    "requestFullscreen",
    "webkitRequestFullscreen",
    "webkitRequestFullScreen",
    "mozRequestFullScreen",
    "msRequestFullscreen",
  ];

  for (const method of methods) {
    if (typeof target[method] === "function") {
      try {
        const res = target[method].call(target);
        if (res && typeof res.then === "function") {
          return res;
        }
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
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

  if (
    !doc.fullscreenElement &&
    !doc.webkitFullscreenElement &&
    !doc.mozFullScreenElement &&
    !doc.msFullscreenElement
  ) {
    return Promise.resolve();
  }

  const methods = [
    "exitFullscreen",
    "webkitExitFullscreen",
    "mozCancelFullScreen",
    "msExitFullscreen",
  ];

  for (const method of methods) {
    if (typeof doc[method] === "function") {
      try {
        const res = doc[method].call(doc);
        return Promise.resolve(res).catch(() => {});
      } catch (e) {
        return Promise.resolve();
      }
    }
  }

  return Promise.resolve();
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
