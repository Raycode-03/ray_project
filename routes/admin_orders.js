  // for sending emails
  require("dotenv").config();
  const express=require('express');
  const router=express.Router();
  const db= require('../data/database');
  // for object _id in the db
  const mongogb=require('mongodb');
  
  const objectid=mongogb.ObjectId
  const transporter = require('../middlewears/mailer');
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

  
  router.post('/admin/orders/:id', async (req, res, next) => {
    if(!res.locals.isauth){
      return res.redirect('/login')
    }
    const id = new objectid(req.params.id);
    
    const delay_date = parseInt(req.body.delay_date);
    
    const current_date = new Date();
    current_date.setDate(current_date.getDate() + delay_date);
    const format_options = {
      weekday:'short',
      year:'numeric',
      month:'long',
      day:'numeric'
    };
    const format_date = current_date.toLocaleDateString('en-US', format_options);
    let order= await db.get_gb().collection('order').findOne({_id:id})
    let olddate = null;
    if(order){
      olddate = order.arrivingdate
    }
    
    
    try {
      const result = await db.get_gb().collection('order').updateOne(
        { _id: id },
        { $set: { arrivingdate : format_date,} }
        
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      const send_notification= async()=>{
        
          if (!order || !order.user || !order.user.email) return;

          const mailOptions = {
                from: `"KongaHub" <${process.env.EMAIL_ADMIN}>`,
                to: order.user.email,
                subject: 'Update on Your Order Delivery',
                text: `Hi ${order.user.fullname || 'customer'}, your order is still being processed. However, the new estimated delivery date is now: ${format_date}. Thanks for your patience.`,
                html: `
                    <p>Hi ${order.user.fullname || 'customer'},</p>
                    <p>Your order is still being processed. However, the new estimated delivery date is now: <strong>${format_date}</strong>. Thanks for your patience.</p>
                    <p>New delivary date: <strong> ${format_date}</strong></p>
                    <p>Previous delivery date: <strong>${olddate || 'N/A'}</strong></p>
                    <p>Thank you for shopping with us!</p>
                    `
          };
        try {
          await transporter.sendMail(mailOptions);
          console.log('Email notification sent');
        } catch (error) {
            console.error('Failed to send email:', error);
        }
      };
      await send_notification();
      
      res.redirect('/admin/orders');
    } catch (err) {
      next(err);
    }
  });

  module.exports=router