require('dotenv').config();  
const express = require('express'); 
const router = express.Router(); 
const https = require('https'); // Make sure this is imported
const db = require('../data/database'); 
const mongodb = require('mongodb'); 
const object_id = mongodb.ObjectId; 

router.post('/paystack', async (req, res, next) => { 
    if(!res.locals.isauth || !req.session.user || !req.session.user.id || !req.session.user.email){
        req.flash('error', 'Not logged in!'); 
        return res.redirect('/login'); 
    }
    email= req.session.user.email;
    const user_id = new object_id(req.session.user.id);
    try{
        const products =await db.get_gb().collection("cart").find({email:email}).toArray();
        if (products.length === 0) { 
            req.flash('error', 'Your cart is empty!'); 
            console.log('Cart is empty for user:', email);
            return res.redirect('/cart'); // Redirect if cart is empty 
        }
        // get date for it to arrive
        currentDate= new Date();
        currentDate.setDate(currentDate.getDate()+25);
        let formatdate = currentDate.toLocaleDateString('en-US', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        }); 
        const total = +req.body.total
        const users =await db.get_gb().collection("signup").findOne({email:email});
        const order= {
            user:{
                _id:user_id,
                email:email,
                address:users.address,
                fullname:users.fullname
            },
            productdata:products,
            arrivingdate:formatdate,
            createdAt: new Date().toISOString(),
            paystackref: null, // This will be updated after successful verification
            paymentVerifiedAt:null,
            total:total,
            status:"pending",
             // Initial status: payment not yet confirmed
        }
        const result = await db.get_gb().collection("order").insertOne(order);
       const orderid = result.insertedId.toString();
       
        const params =  JSON.stringify({
            "email":email,
            "amount":total * 100, // amount in naria from kobo
            "callback_url": `${process.env.APP_BASE_URL}/orders?orderId=${orderid.toString()}`
        });
        const options = {
             hostname: 'api.paystack.co',
            port: 443,
            path: '/transaction/initialize',
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, // Ensure this env var is correct
                'Content-Type': 'application/json'
            } 
        };
        const req_stack = https.request(options, res_stack => {
            let data = '';
            res_stack.on('data', (chunk) => { data += chunk; });
            res_stack.on('end', () => {
            try {
                const response = JSON.parse(data);
                if (response.status && response.data && response.data.authorization_url) {
                    return res.redirect(response.data.authorization_url); // Redirect to Paystack's payment page
                    } else {
                            // Paystack initialization failed
                            console.error('Paystack initialization failed:', response.message || response);
                            // IMPORTANT: Mark the pending order as failed or delete it
                            db.get_gb().collection('order').updateOne(
                                { _id: orderid },
                                { $set: { status: 'initialization_failed', failedAt: new Date(), paystackResponse: response } }
                            ).catch(err => console.error('Failed to update order status after Paystack init error:', err));
        
                            req.flash('error', response.message || 'Failed to initialize payment. Please try again.');
                            return res.redirect('/cart'); // Redirect back to checkout
                        }
                    } catch (parseError) {
                            console.error('Error parsing Paystack response during initialization:', parseError);
                            // Mark the pending order as failed
                            db.get_gb().collection('order').updateOne(
                                { _id: orderid },
                                { $set: { status: 'initialization_parse_error', failedAt: new Date() } }
                            ).catch(err => console.error('Failed to update order status after parse error:', err));
                            req.flash('error', 'Error processing payment initiation. Please try again.');
                            return res.redirect('/cart');
                        }
                    });
            }).on('error', error => {
                // Network error or other request issue
                console.error('Paystack initialization request error:', error);
                // Mark the pending order as failed
                db.get_gb().collection('order').updateOne(
                    { _id: orderid },
                    { $set: { status: 'initialization_network_error', failedAt: new Date(), errorMessage: error.message } }
                ).catch(err => console.error('Failed to update order status after network error:', err));
                req.flash('error', 'Internal Server Error while contacting payment gateway. Please try again.');
                return res.redirect('/cart');
            });
        
            req_stack.write(params); // Send the request body
            req_stack.end(); // End the request - THIS IS CRUCIAL FOR PREVENTING HANGS!
        
            
                
    }catch(err){
        next(err);
    }
});

module.exports = router;