const Section = require("../model/sectionModel/section.model");
const SectionQuestion = require("../model/sectionModel/sectionQuestion.model");
const questionModel = require("../model/question.model");

/**
 * Single source of truth for resolving a test's questions.
 * Mirrors Test -> Sections -> SectionQuestions -> Questions,
 * falling back to the flat Question model when the test has
 * no sections configured.
 *
 * Both the exam-start flow (student-facing) and the grading/results
 * flow (needs the answer key) call this, so a test's structure can
 * never drift between what a student was shown and what they get
 * graded against.
 *
 * @param {String} testId
 * @param {Object} [options]
 * @param {Boolean} [options.includeAnswerKey=false] - keep correct_option_id
 *   for grading. Defaults to false so student-facing responses never leak it.
 * @returns {Promise<Array>} question-like objects with _id, question_text,
 *   options, marks (and correct_option_id when includeAnswerKey is true)
 */
const getTestQuestions = async (testId, options = {}) => {
    const { includeAnswerKey = false } = options;

    const sections = await Section.find({ testId }).sort({ displayOrder: 1 });

    if (sections && sections.length > 0) {
        const questionsList = [];

        for (const sec of sections) {
            const populateOptions = { path: "questionId" };
            if (!includeAnswerKey) {
                populateOptions.select = "-correct_option_id -__v";
            }

            const secQuestions = await SectionQuestion.find({ sectionId: sec._id })
                .sort({ displayOrder: 1 })
                .populate(populateOptions);

            for (const sq of secQuestions) {
                if (!sq.questionId) continue;
                const question = sq.questionId.toObject ? sq.questionId.toObject() : sq.questionId;
                // Section-level marks override the question's own default marks, when set
                const marks = (typeof sq.marks === 'number') ? sq.marks : question.marks;
                questionsList.push({ ...question, marks });
            }
        }

        if (questionsList.length > 0) {
            return questionsList;
        }
    }

    // Fallback: test has no configured sections, use the flat question list
    const projection = includeAnswerKey ? {} : { correct_option_id: 0, __v: 0 };
    return await questionModel.find({ testId }, projection);
};

module.exports = { getTestQuestions };