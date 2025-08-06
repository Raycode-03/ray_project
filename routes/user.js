const express=require('express');
const router=express.Router();
let db=require('../data/database');
const transporter = require('../middlewears/mailer');
router.get('/kongahub',async(req,res)=>{
    const deals=await db.get_gb().collection('products').find({product_type:'deals'}).toArray();
    let fullyear=new Date().getFullYear();
    res.render('user/kongahub',{deals,fullyear});
})
router.post('/kongahub/subscribe',async(req,res)=>{
    const email=req.body.email;
    const existing_user=await db.get_gb().collection('subscribers').findOne({email:email});
    if(existing_user){
        return res.status(409).json({ message: 'You are already subscribed to our newsletter' });
    }
    try{
        await db.get_gb().collection('subscribers').insertOne({email:email});
        const user  = await db.get_gb().collection('signup').findOne({email:email});
         const send_notification= async()=>{
        
          if ( !email) return;

         const fullname = user ? user.fullname : 'Valued Customer';
          const recipient = email;
  const mailOptions = {
    from: `"KongaHub" <${process.env.EMAIL_ADMIN}>`,
    to: recipient,
    subject: 'Thanks for Subscribing to KongaHub!',
    text: `Hi ${fullname},\n\nThank you for subscribing to KongaHub's newsletter. You'll now receive updates on our latest products, exclusive offers, and news straight to your inbox.\n\nWelcome aboard!\n\n– The KongaHub Team`,
    html: `
      <p>Hi ${fullname},</p>
      <p>Thank you for subscribing to <strong>KongaHub</strong>'s newsletter!</p>
      <p>You’ll now receive updates on:</p>
      <ul>
        <li>New product launches</li>
        <li>Exclusive discounts</li>
        <li>Special offers</li>
        <li>Latest company news</li>
      </ul>
      <p>We’re excited to have you with us.</p>
      <p>Welcome aboard!</p>
      <p style="margin-top: 20px;">– The KongaHub Team</p>
    `
  };

          console.log(process.env.EMAIL_ADMIN , process.env.EMAIL_PASS  , "email_ADMIN and email_pass")
        try {
          await transporter.sendMail(mailOptions);
          console.log('Email notification sent');
        } catch (error) {
            console.error('Failed to send email:', error);
        }
      };
      await send_notification();
         return res.status(200).json({ message: 'You have successfully subscribed to our newsletter' });
        
    }
    catch(err){
        console.log(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again later.' });
    }
})

module.exports=router
