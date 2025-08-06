const express=require('express');
const router=express.Router();
const imageupload=require('../middlewears/image_upload');
const db= require('../data/database');
// for object _id in the db
const mongogb=require('mongodb');
const objectid=mongogb.ObjectId

router.get('/cart',async(req,res,next)=>{
    if(!res.locals.isauth){
      return res.status(401).render('error/401');
    }
    try{
    let email=req.session.user.email;
    let cart_item=await db.get_gb().collection('cart').find({email}).toArray();
    let total=0;
    for (item of cart_item){
      let id=new objectid(item.productid)
      let product=await db.get_gb().collection('products').findOne({_id:id})
      if(product){
        item.price=product.price
        item.title=product.title
      }
      let total_amount=item.price* item.amount
      total = total_amount+ total;
      await db.get_gb().collection('cart').updateOne({_id:item._id},{$set:{
        title:item.title,
        price:item.price,
        total_amount:total_amount
      }})
    }
    res.render('user/user_cart',{cart_item,total})
  }
  catch(err){
    next(err) 
  }
  })
router.post('/cart/:id',async(req,res,next)=>{
  if(!res.locals.isauth){
    return res.redirect('/login')
  }
  try{
    id=new objectid(req.params.id);
    let delete_cart= await db.get_gb().collection('cart').deleteOne({_id:id});
    res.redirect('/cart');
  }
  catch(err){
    next(err)
  }
  return
})

module.exports=router;