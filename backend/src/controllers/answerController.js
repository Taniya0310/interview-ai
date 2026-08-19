const answerService = require('../services/answerService');

exports.create = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'video is required' });
    }

    const answer = await answerService.create({
      interviewId: req.params.interviewId,
      interviewQuestionId: req.body.interviewQuestionId,
      parentAnswerId: req.body.parentAnswerId,
      file: req.file,
    });

    return res.status(202).json(answer);
  } catch (error) {
    return next(error);
  }
};

exports.get = async (req, res, next) => {
  try {
    const answer = await answerService.get(req.params.id);
    if (!answer) return res.sendStatus(404);
    return res.json(answer);
  } catch (error) {
    return next(error);
  }
};

exports.list = async (req, res, next) => {
  try {
    return res.json(await answerService.list(req.params.interviewId));
  } catch (error) {
    return next(error);
  }
};
