const express=require('express');
const router=express.Router();
router.get('/check_session',(req,res)=>{
    if(req.session&&req.session.user){
        res.json({valid:true})
    }
    else{
        res.json({valid:false})
    }
})
module.exports=router