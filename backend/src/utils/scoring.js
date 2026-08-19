const keys=['technicalCorrectness','relevance','communication','structure','speakingBehavior','presentation'];
function average(rows){const out={}; for(const k of keys) out[k]=rows.length?Math.round(rows.reduce((n,r)=>n+Number(r[k]||0),0)/rows.length):0; return out;}
module.exports={keys,average};
