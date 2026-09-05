const interviewService =
  require("../services/interviewService");

exports.create = async (req, res, next) => {
  try {
    const userId =
      req.user.userId;

    const interview =
      await interviewService.create(
        req.body,
        userId
      );

    res.status(201).json(interview);
  } catch (error) {
    next(error);
  }
};

exports.get = async (req, res, next) => {
  try {
    const userId =
      req.user.userId;

    const interview =
      await interviewService.get(
        req.params.id,
        userId
      );

    if (!interview) {
      return res.sendStatus(404);
    }

    res.json(interview);
  } catch (error) {
    next(error);
  }
};

exports.list = async (req, res, next) => {
  try {
    const userId =
      req.user.userId;

    const interviews =
      await interviewService.list(
        userId
      );

    res.json(interviews);
  } catch (error) {
    next(error);
  }
};
exports.heartbeat = async (req, res, next) => {
  try {
    await interviewService.heartbeat(
      req.params.id,
      req.user.userId
    );

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

exports.quit = async (req, res, next) => {
  try {
    await interviewService.quit(
      req.params.id,
      req.user.userId
    );

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};
exports.finish = async (req, res, next) => {
  try {
    const userId =
      req.user.userId;

    await interviewService.finish(
      req.params.id,
      userId
    );

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};