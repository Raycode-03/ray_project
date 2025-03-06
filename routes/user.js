const express=require('express');
const router=express.Router();
let db=require('../data/database');
router.get('/kongahub',async(req,res)=>{
    const deals=await db.get_gb().collection('products').find({product_type:'deals'}).toArray();
    let fullyear=new Date().getFullYear();
    res.render('user/kongahub',{deals,fullyear});
})

module.exports=router
