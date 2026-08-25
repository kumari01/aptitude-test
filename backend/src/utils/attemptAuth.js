/**
 * Confirms the authenticated user (req.user, set by your JWT auth
 * middleware) owns this exam attempt.
 *
 * If req.user isn't set — meaning the route doesn't have auth
 * middleware attached yet — this passes through rather than
 * blocking, so it won't break routes you haven't wired up auth
 * for yet. Attach the auth middleware to attempt-related routes
 * (save answer, submit, get answers, get results) to get real
 * enforcement out of this.
 *
 * @param {Object} attempt - the ExamAttempt document
 * @param {Object} req - the Express request object
 * @returns {Boolean}
 */
const isAttemptOwner = (attempt, req) => {
    if (!req.user?.id) {
        return false;
    }

    if (!attempt?.student_id) {
        return false;
    }

    return attempt.student_id.toString() === req.user.id.toString();
};

module.exports = { isAttemptOwner };