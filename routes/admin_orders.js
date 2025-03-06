const express=require('express');

const router=express.Router();
const db= require('../data/database');
// for object _id in the db
const mongogb=require('mongodb');
const objectid=mongogb.ObjectId

router.get('/admin/orders',async(req,res)=>{
  if(!res.locals.isauth){
    return res.redirect('/login')
  }

  if(!res.locals.isAdmin){
    return res.status(403).render('error/403');
  }
  const orders=await db.get_gb().collection('order').find().toArray();
    res.render('admin/admin_orders',{orders})
});

router.patch('/admin/orders/:id', async (req, res, next) => {
  const id = new objectid(req.params.id);
  const newstatus = req.body.newstatus;
  console.log(newstatus)
  try {
    const result = await db.get_gb().collection('order').updateOne(
      { _id: id },
      { $set: { status: newstatus } }
      
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Order updated', newstatus });
  } catch (err) {
    next(err);
  }
});

module.exports=router