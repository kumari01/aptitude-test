const mongoose = require("mongoose");
const Section = require("../model/sectionModel/section.model");
const SectionQuestion = require("../model/sectionModel/sectionQuestion.model");
const questionModel = require("../model/question.model");

/**
 * Single source of truth for resolving a test's questions.
 * Handles both Section-based question layouts and direct/flat question layouts.
 *
 * @param {String|ObjectId} testId
 * @param {Object} [options]
 * @param {Boolean} [options.includeAnswerKey=false] - keep correct_option_id for grading
 * @returns {Promise<Array>} question objects
 */
const getTestQuestions = async (testId, options = {}) => {
    if (!testId) return [];
    const { includeAnswerKey = false } = options;

    const queryIds = [testId, testId.toString()];
    if (mongoose.Types.ObjectId.isValid(testId)) {
        queryIds.push(new mongoose.Types.ObjectId(testId));
    }

    // 1. Check if sections are configured for this test
    const sections = await Section.find({ testId: { $in: queryIds } }).sort({ displayOrder: 1 });

    if (sections && sections.length > 0) {
        const questionsList = [];
        const sectionIds = sections.map(s => s._id);

        const populateOptions = { path: "questionId" };
        if (!includeAnswerKey) {
            populateOptions.select = "-correct_option_id -__v";
        }

        const secQuestions = await SectionQuestion.find({ sectionId: { $in: sectionIds } })
            .sort({ displayOrder: 1 })
            .populate(populateOptions);

        for (const sq of secQuestions) {
            if (!sq.questionId) continue;
            const question = sq.questionId.toObject ? sq.questionId.toObject() : { ...sq.questionId };
            const marks = (typeof sq.marks === "number") ? sq.marks : (question.marks || 1);
            questionsList.push({ ...question, marks });
        }

        if (questionsList.length > 0) {
            return questionsList;
        }
    }

    // 2. Fallback: Flat direct questions lookup by testId / exam_id
    const projection = includeAnswerKey ? {} : { correct_option_id: 0, __v: 0 };
    const directQuestions = await questionModel.find({
        $or: [
            { testId: { $in: queryIds } },
            { exam_id: { $in: queryIds } }
        ]
    }, projection);

    return directQuestions.map(q => (q.toObject ? q.toObject() : q));
};

/**
 * Resolve a single question and its options given a questionId or sectionQuestionId
 * @param {String|ObjectId} questionId
 * @param {Object} [options]
 * @returns {Promise<Object|null>}
 */
const getSingleQuestion = async (questionId, options = {}) => {
    if (!questionId) return null;
    const { includeAnswerKey = true } = options;
    const projection = includeAnswerKey ? {} : { correct_option_id: 0, __v: 0 };

    let question = await questionModel.findById(questionId, projection);
    if (!question) {
        const secQ = await SectionQuestion.findById(questionId).populate({
            path: "questionId",
            select: includeAnswerKey ? "" : "-correct_option_id -__v"
        });
        if (secQ && secQ.questionId) {
            const raw = secQ.questionId.toObject ? secQ.questionId.toObject() : secQ.questionId;
            question = { ...raw, marks: secQ.marks || raw.marks || 1 };
        }
    }
    return question ? (question.toObject ? question.toObject() : question) : null;
};

/**
 * Calculate the total possible marks for a test
 * @param {String|ObjectId} testId
 * @returns {Promise<number>}
 */
const getTestTotalMarks = async (testId) => {
    const questions = await getTestQuestions(testId, { includeAnswerKey: true });
    if (questions.length === 0) return 0;
    return questions.reduce((sum, q) => sum + (q.marks || 1), 0);
};

module.exports = { getTestQuestions, getSingleQuestion, getTestTotalMarks };