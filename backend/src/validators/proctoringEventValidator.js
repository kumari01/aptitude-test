const Joi = require("joi");

const PROCTORING_EVENT_TYPES = [
  "TAB_SWITCH",
  "FULLSCREEN_EXIT",
  "WINDOW_BLUR",
  "COPY",
  "PASTE",
  "MULTIPLE_FACE",
  "NO_FACE",
  "SCREEN_SHARE_STOPPED",
];

const createProctoringEventSchema = Joi.object({
  eventType: Joi.string()
    .valid(...PROCTORING_EVENT_TYPES)
    .required(),
}).required();

const validateCreateProctoringEvent = (req, res, next) => {
  const { error } = createProctoringEventSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid proctoring event",
      errors: error.details.map((detail) => detail.message),
    });
  }

  next();
};

module.exports = {
  validateCreateProctoringEvent,
};
