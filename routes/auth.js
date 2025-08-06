const express=require('express');
const router=express.Router();
const db=require('../data/database');
const bcrypt=require('bcryptjs');
const validator = require("validator");
const transporter = require('../middlewears/mailer');
router.get('/',(req,res)=>{
  res.redirect('/kongahub');
})
router.get('/signup',(req,res)=>{
//session is being requested even when session has expired 
// Raymond work on when system works 
  let session_inputdata=req.session.inputdata
  if(!session_inputdata){
    session_inputdata={
      hasError:false,
      hasemail:"",
      hasfullname:'',
      hascountry:'',
      hasstate:'',
    }
  }

    
  req.session.inputdata=null
  res.render('auth/signup',{inputdata:session_inputdata})
})
router.post('/signup',async(req,res)=>{
  try{
  const email=req.body.email
  const password=req.body.password
  const con_password=req.body.conpassword
  const fullname=req.body.fullname
  const state=req.body.state
  const country = req.body.country
 
  // for the errors
  if (!email||!password||!fullname||!state||!country||con_password!=password){
    req.session.inputdata={
        hasError:true,
        Message:"Invalid Input-- please check your data ",
        hasfullname:fullname,
        hasemail:email,
        hasstate:state,
        hascountry:country
        
    }
    req.session.save(()=>{
      res.redirect('/signup'); 
    })
    // 
    return
  }
   // for the email vaildation
  if(!validator.isEmail(email)){
    req.session.inputdata={
      hasError:true,
      Message:"Invalid Email -- Please Provide a Vaild Email",
      hasfullname:fullname,
      hasemail:email,
      hasstate:state,
      hascountry:country
    }
    req.session.save(()=>{
      res.redirect('/signup'); 
    })
    return;
  }
    // check if there's existing user
  const existing_user= await db.get_gb().collection('signup').findOne({email:email})
  if(existing_user){
    req.session.inputdata={
      hasError:true,
      Message:"User found - User already exists in the database",
      hasfullname:fullname,
      hasemail:email,
      hasstate:state,
      hascountry:country
  }
  req.session.save(()=>{
    res.redirect('/signup'); 
  })
  // this is needed so that it would cancel
  return
}
  // to send the data to db
    const hash_password=await bcrypt.hash(password,12)
    //  for the name 
    function titlecase(str){
      return str.toLowerCase().split(' ').map(word=>{return word.charAt(0).toUpperCase()+word.slice(1)}).join(' ');
    }
    fullname= titlecase(fullname);
    const data={
      email,
      password:hash_password,
      fullname: fullname,
      address:{
          country,
          state
      },
      date:new Date().toLocaleDateString('en-US',{
        weekday:'short',
        day:'numeric',
        month:'long',
        year:'numeric'
      })
    }
    const new_signup = await db.get_gb().collection('signup').insertOne(data);
    if(new_signup){
      const sendwelcomemessage = async()=>{
            const mailOptions = {
                from: `"KongaHub" <${process.env.EMAIL_ADMIN}>`,
                to: email,
                subject: 'Welcome to KongaHub!',
                text: `Hi ${fullname || 'customer'}, welcome to our site!`,
                html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <img src="https://res.cloudinary.com/dkolikr3y/image/upload/v1754471462/welcome_lqdubh.jpg" alt="Welcome to KongaHub" style="max-width: 100%; height: auto; margin-bottom: 20px;">
                    <p>Hi ${fullname || 'customer'},</p>
                    <p>Welcome to the <strong>KongaHub</strong> family!</p>
                    <p>You’re now part of a community that loves unique gadgets — from phones and laptops to watches and home appliances.</p>
                    <p>To get started, explore our latest collections. We’ve got something special for everyone — including you.</p>
                    <p>Happy Shopping!</p>
                    <p><strong>The KongaHub Team</strong></p>
                    </div>
                    `,
            };

        try {
          await transporter.sendMail(mailOptions);
          console.log('Email notification sent');
        } catch (error) {
            console.error('Failed to send email:', error);
        }
      }
      await sendwelcomemessage();
    }

    res.redirect('/login')
  
  return
}
  catch(err){
    console.log(err);
  }
})
// login 
router.get('/login',(req,res)=>{
  let session_inputdata=req.session.inputdata
  if(!session_inputdata){
    session_inputdata={
    hasError:false,
    hasEmail:'',
    }

  }
  req.session.inputdata=null
  res.render('auth/login',{inputdata:session_inputdata});
})
router.post('/login',async(req,res)=>{
  const email=req.body.email
  const password=req.body.password
  const existing_user= await db.get_gb().collection('signup').findOne({email:email})
  if(!existing_user){
      req.session.inputdata={
        hasError:true,
        Message:'Could not log you in-- user doesn"t exists', 
        hasemail:email
      }
      req.session.save(()=>{
          res.redirect('/login');
      })
      return
  }
  const password_equal= await bcrypt.compare(password,existing_user.password)
  if(!password_equal){
    req.session.inputdata={
      hasError:true,
      Message:'Could not log you in-- please check your credentials!!', 
      entered_email:email,
      entered_password:password
    };
    req.session.save(()=>{
      console.log('no data found!!!')
      res.redirect('/login');
    })
   return 
  }
  if(password_equal){
    req.session.user={id:existing_user._id,email:existing_user.email}
    req.session.isAuthenticated=true
    req.session.save(function (){
      if(res.locals.isadmin){
        return res.redirect('/admin')
      }
      if(!res.locals.isadmin){
        return res.redirect('/kongahub');
    }
    })
  }
  
})

router.post('/logout',async(req,res)=>{
  req.session.user=null;
  req.session.isAuthenticated=false
  res.redirect('/login')
})
module.exports=router
