const express = require('express');
const answerController = require('../controllers/answerController');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post(
  '/interviews/:interviewId/answers',
  upload.single('video'),
  answerController.create
);
router.get('/answers/:id', answerController.get);
router.get('/interviews/:interviewId/answers', answerController.list);

module.exports = router;
