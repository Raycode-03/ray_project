const express=require('express');
const app=express()
const body_parser=express.urlencoded({extended:false});
const path=require ('path');
const db=require('./data/database');
// for port
let port=3000;
// using enviroment variables
if(process.env.PORT){
    port=process.env.PORT
}
// session
const session=require('express-session');
const mongodb_session=require('connect-mongodb-session')
let mongodbstore=mongodb_session(session)
// for csrf
let csrf=require('csurf')
let addcsrftokenmiddlewear=require('./middlewears/csrf_token');

//  flash messages
const flash = require('connect-flash');
// static files
app.use(body_parser);
app.use(express.static('./public'))
app.use('/product_data',express.static('product_data'))
// routes

const auth=require('./routes/auth');
const admin=require('./routes/admin');
const user=require('./routes/user');
const user_products=require('./routes/user_products');
const cart=require('./routes/cart');
const order=require('./routes/orders');
const admin_order=require('./routes/admin_orders');
// to prevent submit
let prevent_submit=require('./routes/prevent_submit');
// payment
let payment=require('./routes/payment');
// for the ejs 
app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');

// for the session database
let mongodb_url='mongodb://localhost:27017';
// using enviroment variables
if(process.env.MONGODB_URL){
    mongodb_url=process.env.MONGODB_URL;
}
const store=new mongodbstore(
    {
        // the mongodb_url is needed for the session
        uri:mongodb_url,
        databaseName:'ray',
        collection:'session'
    }
)
store.on('error',(error)=>{
    console.log(error);
})

// for the session settings
const session_set=session({
    secret:'super-secret',
    resave:false,
    saveUninitialized:false,
    store:store,
    cookie:{
        // max age in milli second
        maxAge: 600*1000,
    }
})

// json parse
app.use(express.json())
app.use(session_set)
app.use(flash())
//  for csurf
app.use(csrf())
app.use(addcsrftokenmiddlewear)

// auth
app.use(async (req,res,next)=>{
    const user=req.session.user;
    const isauth=req.session.isAuthenticated;
    if(!user||!isauth){
        return next();
    }
    let isAdmin=false
    const user_db=await db.get_gb().collection('signup').findOne({_id:user.id})
	if(user_db){
 	   const isAdmin=user_db.isAdmin|| false
		    res.locals.isauth=isauth
		    res.locals.isAdmin=isAdmin
	}
    next();
}
)
// middlewear for the routes
app.use(auth);
app.use(user);
app.use(user_products);
app.use(cart);
app.use('/admin',admin)
// for payment
app.use(payment);
app.use(order);
app.use(admin_order);
app.use((req,res)=>{
    res.status(404).render('error/404');
});
// for the server side error
app.use((err,req,res,next)=>{
    console.log(err)
    res.status(500).render('error/500');
    next()
});
db.connect_db()
.then( function(){app.listen(port,()=>{
        console.log('http://localhost:3000')
    })
})
.catch((err) => {
    console.log(err)
})