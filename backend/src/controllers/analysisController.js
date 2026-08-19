const s=require('../services/analysisService');exports.report=async(req,res)=>{const x=await s.report(req.params.interviewId);if(!x)return res.sendStatus(404);res.json(x)};
