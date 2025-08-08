const express=require('express');
const router=express.Router();
const imageupload=require('../middlewears/image_upload');
const db= require('../data/database');
// for object _id in the db
const mongogb=require('mongodb');
const objectid=mongogb.ObjectId
router.get('/kongahub/watches',async(req,res)=>{
    if(!res.locals.isauth){
         return res.redirect('/login')
      }
      let products=await db.get_gb().collection('products').find({product_type:"watches"}).toArray();
  
  
      res.render('user/user_watches',{products,messages:req.flash()});
      return
})
router.get('/kongahub/phones',async(req,res)=>{
  if(!res.locals.isauth){
    return res.redirect('/login')
    }
    let products=await db.get_gb().collection('products').find({product_type:"phones"}).toArray();
    
  
 
    res.render('user/user_phones',{products,messages:req.flash()});
})
router.get('/kongahub/laptops',async(req,res)=>{
  if(!res.locals.isauth){
    return res.redirect('/login')
    }
    let products=await db.get_gb().collection('products').find({product_type:"laptops"}).toArray();

    res.render('user/user_laptops',{products,messages:req.flash()});
})
router.get('/kongahub/electronic_accessories',async(req,res)=>{
  if(!res.locals.isauth){
    return res.redirect('/login')
    }
    let products=await db.get_gb().collection('products').find({product_type:"electronic_accessories"}).toArray();
   
    res.render('user/user_electronic_accessories',{products,messages:req.flash()});
})
router.get('/kongahub/:page_type/details/:id',async(req,res)=>{
  if(!res.locals.isauth){
    return res.redirect('/login')
  }
  try{
  let page_type=req.params.page_type;
  let id=new objectid(req.params.id);
  const details=await db.get_gb().collection('products').findOne({product_type:page_type,_id:id})
  
  res.render('user/details',{details,messages:req.flash()});
  }
  catch(err){
    next(err);
  }
  

})
router.post('/kongahub/products/cart/:id', async (req, res, next) => {
  if(!res.locals.isauth){
      return res.redirect('/login')
      }
  try {
    // Check if user is logged in
    if (!req.session.user) {
      req.flash('error', 'You must be logged in to add products to the cart.');
      return res.redirect('/login');
    }

    // Validate and convert the ID to ObjectId
    const id = new objectid(req.params.id);

    // Fetch the product details from the database
    const existingProduct = await db.get_gb().collection('products').findOne({ _id: id });

    if (!existingProduct) {
      req.flash('error', 'Product not found.');
      return res.redirect(req.headers.referer || '/');
    }

    const { title, price, imageUrl } = existingProduct;
    console.log(existingProduct)
    const amount = +req.body.amount;

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      req.flash('error', 'Invalid quantity.');
      return res.redirect(req.headers.referer || '/');
    }

    const total_amount = price * amount;
    const email = req.session.user.email;

    // Prepare the cart item data
    const data = {
      title,
      price,
      imageUrl,
      amount,
      total_amount,
      email,
      productid:id
    };

    // Check if the product already exists in the cart for the user
    const existingCartItem = await db.get_gb().collection('cart').findOne({ title, email });

    if (existingCartItem) {
      // Update the existing cart item
      const new_amount = existingCartItem.amount + amount;
      const new_total = new_amount * price;

      await db.get_gb().collection('cart').updateOne(
        { title, email },
        {
          $set: {
            amount: new_amount,
            total_amount: new_total,
          },
        }
      );

      req.flash('success', 'Product quantity updated in cart!');
    } else {
      // Insert a new cart item
      await db.get_gb().collection('cart').insertOne(data);
      req.flash('success', 'Product added successfully to cart!');
    }

    // Save the session and redirect
    req.session.save(() => {
      res.redirect(req.headers.referer || '/');
    });
  } catch (err) {
    next(err);
  }
});
// for the filter part 
router.get('/kongahub/:page_type/filter',async(req,res,next)=>{
  if(!res.locals.isauth){
    return res.redirect('/login')
  }
  try{
  const page_type=req.params.page_type
  const filteritem=req.query.filteritem
  const products=await db.get_gb().collection('products').find({product_type:page_type,product_brand:filteritem}).toArray();
  console.log(products)
  res.json(products);
  }
  catch(err){
    next(err);
  }
})
module.exports=router