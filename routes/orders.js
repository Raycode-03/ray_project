const express=require('express');
const router=express.Router();
const db= require('../data/database');
// for object _id in the db
const mongogb=require('mongodb');
const objectid=mongogb.ObjectId
router.get('/orders',async(req,res)=>{
    if(!res.locals.isauth){
      return res.redirect('/login')
      }
      let email=req.session.user.email;
      // let user_email=user.email
      let orders=await db.get_gb().collection('order').find({"user.email":email}).toArray();
      res.render('user/order',{orders});
})
router.post('/orders',async(req,res,next)=>{
    try{
      let uid=req.session.user.id;
    const email = req.session.user.email;
    let status='pending';
    let total=+req.query.total;
    let user=await db.get_gb().collection('signup').findOne({_id:uid,email},{projection:{password:0,date:0}});
    let productdata= await db.get_gb().collection('cart').find({email}).toArray(); 
    // convert to plain objects
    // date arriving date
    let currentdate=new Date()
      currentdate.setDate(currentdate.getDate()+15)
      let formatdate=currentdate.toLocaleDateString('en-US',{
        weekday:'short',
        day:'numeric',
        month:'long',
        year:'numeric'
      })
    let order={
      user,
      productdata,
      total,
      status,
      arriving_date:formatdate

    }
    let orders=await db.get_gb().collection('order').insertOne(order);
    if(orders){
      await db.get_gb().collection('cart').deleteMany({email:email});
    }
    res.redirect('/orders');
    }
    catch(err){
      next(err);
    }
})

module.exports=router