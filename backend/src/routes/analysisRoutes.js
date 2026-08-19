const r=require('express').Router(),c=require('../controllers/analysisController');r.get('/interviews/:interviewId/report',c.report);module.exports=r;
