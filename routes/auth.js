const express=require('express');
const router=express.Router();
const db=require('../data/database');
const bcrypt=require('bcryptjs');

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
  if (!email||!password||!fullname||!state||!country||con_password!=password||!email.includes("@")){
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
    const data={
      email,
      password:hash_password,
      fullname,
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
    await db.get_gb().collection('signup').insertOne(data);
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
    hasErrror:false,
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
