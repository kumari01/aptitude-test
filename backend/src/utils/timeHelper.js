/**
 * Centralized helper to calculate attempt timing and check time-expiry.
 * @param {Object} attempt - ExamAttempt document containing started_at or createdAt
 * @param {number} durationMinutes - Duration of test in minutes
 * @returns {Object} { durationSeconds, elapsedSeconds, remainingSeconds, isExpired }
 */
const checkAttemptTiming = (attempt, durationMinutes = 30) => {
    const durationMinutesNum = (durationMinutes && typeof durationMinutes === 'number' && durationMinutes > 0)
        ? durationMinutes
        : 30;
    const durationSeconds = durationMinutesNum * 60;
    const startedAtMs = new Date(attempt.started_at || attempt.createdAt || Date.now()).getTime();
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000));
    const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);
    const isExpired = elapsedSeconds >= durationSeconds;

    return {
        durationSeconds,
        elapsedSeconds,
        remainingSeconds,
        isExpired
    };
};

module.exports = { checkAttemptTiming };
