const trainingService =
  require("../services/trainingService");

async function getQuestions(
  req,
  res,
  next
) {
  try {
    const questions =
      await trainingService.getQuestions(
        req.query.categoryId,
        req.query.limit
      );

    res.json(questions);
  } catch (error) {
    next(error);
  }
}

async function createSession(
  req,
  res,
  next
) {
  try {
    const result =
      await trainingService.createSession(
        req.user.userId,
        req.body
      );

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function submitAnswer(
  req,
  res,
  next
) {
  try {
    const result =
      await trainingService.submitAnswer(
        req.user.userId,
        req.params.id,
        {
          ...req.body,
          file: req.file
        }
      );

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
async function createSession(req, res, next) {
  try {
    console.log("[TRAINING SESSION BODY]", req.body);

    const result =
      await trainingService.createSession(
        req.user.userId,
        req.body
      );

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
async function completeSession(
  req,
  res,
  next
) {
  try {
    const session =
      await trainingService.completeSession(
        req.user.userId,
        req.params.id
      );

    res.json(session);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getQuestions,
  createSession,
  submitAnswer,
  completeSession
};