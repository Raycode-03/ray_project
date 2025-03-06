const express=require('express');
const router=express.Router();
const imageupload=require('../middlewears/image_upload');
const db= require('../data/database');
// for object _id in the db
const mongogb=require('mongodb');
const objectid=mongogb.ObjectId
router.get('/products',async(req,res,next)=>{
    if(!res.locals.isauth){
      return res.redirect('/login')
    }
  
    if(!res.locals.isAdmin){
      return res.status(403).render('error/403');
    }
    try{
      const product=await db.get_gb().collection('products').find().toArray();
      res.render('admin/admin_products',{product})
    }
    catch(err){
      next(err)
    }
    return
  })
router.get('/products/new',(req,res)=>{
  if(!res.locals.isauth){
    return res.redirect('/login')
  }

  if(!res.locals.isAdmin){
    return res.status(403).render('error/403');
  }
  let product_session=req.session.inputdata;
  if(!product_session){
      product_session={
        hasError:false,
        title:'',
        summary:'',
        price:'',
        description:'',

  }
}
    req.session.inputdata=null
    res.render('admin/admin_newproducts',{update:product_session})

});
router.post('/products/new',imageupload,async(req,res,next)=>{
  try{  
  const title=req.body.title.trim();
  const summary=req.body.summary.trim();
  // adding + for the price makes it number
  const price=+req.body.price;
  const description=req.body.description;
  // product type
  const product_type=req.body.product
  const product_brand=req.body.brand.trim()
  // both the name and the encoded path is needed
  const imagename=req.file.filename;
  const image_path=`/product_data/image/${imagename}`
  let data={
    title,
    summary,
    price,
    description,
    product_type,
    product_brand:product_brand.toLowerCase(),
    image_path
  }
  if(!product_type||!title||!summary||!price||!description||!image_path||!product_brand){
    req.session.inputdata={
      hasError:true,
      Message:"please select a product type or check the inputs",
      title,
      summary,
      price,
      description,
      
    }
    req.session.save(()=>{
      console.log('saved');
      res.redirect('/admin/products/new');
    })
    return
}
  else{
    await db.get_gb().collection('products').insertOne(data)
    res.redirect('/admin/products')
  }
  }
  catch(err){
    next(err);
  }
  return
});
router.get('/products/update/:id',async(req,res,next)=>{
  if(!res.locals.isauth){
    return res.redirect('/login')
  }
  if(!res.locals.isAdmin){
    return res.status(403).render('error/403');
  }
  try{
   let id=new objectid(req.params.id)
    const update=await db.get_gb().collection('products').findOne({_id:id})
    res.render('admin/admin_update_product',{update});
    }
  catch(err){
    next(err)
  }
  return 
})
router.post('/products/update/:id',imageupload,async(req,res,next)=>{
  try{
    const id=new objectid(req.params.id)
    const title=req.body.title;
  const summary=req.body.summary;
  const price=+req.body.price;
  const description=req.body.description;
  const imagename=req.file.filename;
  const image_path=`/product_data/image/${imagename}`
    const data={
      title,summary,price,description,image_path
  }
 
  
  if(data){
    const update=await db.get_gb().collection('products').updateOne({_id:id},{$set:data})
  res.redirect('/admin/products');
  }
}
  catch(err){
    next(err)
  }

  
  return
})
router.delete('/products/delete/:id',async(req,res,next)=>{
  try{
    const id=new objectid(req.params.id)
    let deleteproduct= await db.get_gb().collection('products').deleteOne({_id:id});
    res.json({message:'Deleted porduct!!'})
  }
  catch(err){
    next(err);
  }
  return
})


module.exports=router