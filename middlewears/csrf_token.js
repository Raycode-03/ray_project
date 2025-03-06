function addcsrftoken(req,res,next){
    res.locals.csrfToken=req.csrfToken();
    next();
}
module.exports=addcsrftoken;