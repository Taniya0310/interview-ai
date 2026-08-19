const interviewService = require('../services/interviewService');

exports.create = async (req, res, next) => {
  try {
    const interview = await interviewService.create(req.body);
    res.status(201).json(interview);
  } catch (error) {
    next(error);
  }
};

exports.get = async (req, res, next) => {
  try {
    const interview = await interviewService.get(req.params.id);
    if (!interview) return res.sendStatus(404);
    res.json(interview);
  } catch (error) {
    next(error);
  }
};

exports.finish = async (req, res, next) => {
  try {
    await interviewService.finish(req.params.id);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};
