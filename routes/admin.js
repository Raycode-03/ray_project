const express=require('express');
const router=express.Router();
const imageupload=require('../middlewears/image_upload');
const db= require('../data/database');
const cloudinary=  require('../data/cloudinary')
const fs=require('fs/promises')
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
  const image_path=req.file.path;
  // const image_path=`/product_data/image/${imagename}`
 
  let data={
    title,
    summary,
    price,
    description,
    product_type,
    product_brand:product_brand.toLowerCase(),
    
  }
  if(!product_type||!title||!summary||!price||!description||!product_brand){
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
  data.imageUrl = '';
        data.publicId = '';

        if (!req.file) { // Check if Multer successfully processed a file
            req.session.inputdata = { /* your existing input data */ };
            return req.session.save(() => {
                req.flash('error_msg', 'No product image was uploaded. An image is required.');
                res.redirect('/admin/products/new');
            });
        }

        try {
            // AWAIT the Cloudinary upload
            // Assumes cloudinary.uploader.upload returns a Promise (modern SDK)
            const cloudinaryResult = await cloudinary.uploader.upload(image_path, {
                folder: "ray_node_products" // The folder name in your Cloudinary account
            });

            console.log("Cloudinary Upload Result:", cloudinaryResult);

            // Update the 'data' object with the image information
            data.imageUrl = cloudinaryResult.secure_url;
            data.publicId = cloudinaryResult.public_id;

            // Delete the temporary file from your local server
            await fs.unlink(image_path);
            console.log(`Deleted temporary file: ${image_path}`);

        } catch (cloudinaryErr) {
            // If Cloudinary upload fails, handle the error
            console.error("Cloudinary Upload Error:", cloudinaryErr);
            // Attempt to delete the temporary file even if Cloudinary upload failed
            try {
                await fs.unlink(image_path);
            } catch (e) {
                console.error("Error deleting temporary file after Cloudinary failure:", e);
            }

            // Render an error page and stop execution
            return res.status(500).render('error/500');
        }
        // --- END OF IMAGE UPLOAD RELATED CHANGES ---

        // --- START OF YOUR ORIGINAL DATABASE INSERTION AND REDIRECTION ---
        // This part now only executes IF the image upload (and all previous steps) succeeded.
        await db.get_gb().collection('products').insertOne(data);
        res.redirect('/admin/products');
        // --- END OF YOUR ORIGINAL DATABASE INSERTION AND REDIRECTION ---

    } catch (err) {
        // This catch block handles errors from any synchronous code or awaited promises
        // that were not caught in a more specific inner try-catch block.
        next(err);
    }
  
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
  const image_path=req.file.path;
  // const image_path=`/product_data/image/${imagename}`
    const data={
      title,summary,price,description,image_path
  }
  

        if (!req.file) { // Check if Multer successfully processed a file
            req.session.inputdata = { /* your existing input data */ };
            return req.session.save(() => {
                req.flash('error_msg', 'No product image was uploaded. An image is required.');
                res.redirect('/admin/products/new');
            });
        }

        try {
          // get the private_url using the id
          const product_url=await db.get_gb().collection('products').find({_id:id});
            // AWAIT the Cloudinary upload
            // Assumes cloudinary.uploader.upload returns a Promise (modern SDK)
            const cloudinaryResult = await cloudinary.uploader.upload(image_path, {
                folder: "ray_node_products" // The folder name in your Cloudinary account
            });

            console.log("Cloudinary Upload Result:", cloudinaryResult);

            // Delete the temporary file from your local server
            await fs.unlink(image_path);
            console.log(`Deleted temporary file: ${image_path}`);

        } catch (cloudinaryErr) {
            // If Cloudinary upload fails, handle the error
            console.error("Cloudinary Upload Error:", cloudinaryErr);
            // Attempt to delete the temporary file even if Cloudinary upload failed
            try {
                await fs.unlink(image_path);
            } catch (e) {
                console.error("Error deleting temporary file after Cloudinary failure:", e);
            }

            // Render an error page and stop execution
            return res.status(500).render('error/500');
        }
        // --- END OF IMAGE UPLOAD RELATED CHANGES ---
        if(data){
            const update=await db.get_gb().collection('products').updateOne({_id:id},{$set:data})
            res.redirect('/admin/products');
          }
        // --- START OF YOUR ORIGINAL DATABASE INSERTION AND REDIRECTION ---
        // This part now only executes IF the image upload (and all previous steps) succeeded.
        
        // --- END OF YOUR ORIGINAL DATABASE INSERTION AND REDIRECTION ---

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