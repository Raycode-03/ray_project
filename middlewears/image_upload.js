//  for the fies parsing 
const uuid=require('uuid').v4;
const multer=require('multer');
const upload=multer({
    storage:multer.diskStorage({
        destination:'product_data/image',
        filename:function(req,file,cb){
            // creating a unique imagename that cant be used more than once 
            cb(null, uuid()+ '-'+file.originalname);
        }
    })
});

const configmulter=upload.single('image')
module.exports=configmulter;