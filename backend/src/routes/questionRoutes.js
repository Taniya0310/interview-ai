const r=require('express').Router(),c=require('../controllers/questionController');r.get('/',c.list);r.post('/',c.create);r.patch('/:id',c.update);r.delete('/:id',c.remove);module.exports=r;
