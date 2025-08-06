// Assuming this is your /paystack route file 
require('dotenv').config();  
const express = require('express'); 
const router = express.Router(); 
const https = require('https'); // Make sure this is imported
const db = require('../data/database'); 
const mongodb = require('mongodb'); 
const ObjectId = mongodb.ObjectId; 

router.post('/paystack', async (req, res, next) => { 
    // --- Authentication Check --- 
    // This check ensures req.session.user and isAuthenticated are present.
    // Ensure req.session.user.id and .email exist too for safety
    if (!res.locals.isauth || !req.session.user || !req.session.user.id || !req.session.user.email) { 
        req.flash('error', 'User session data incomplete or not authenticated. Please log in.');
        return res.redirect('/login'); 
    } 

    const email = req.session.user.email;
    // CRITICAL FIX: Convert string ID from session to MongoDB ObjectId
    // If req.session.user.id is stored as a string (e.g., existing_user._id.toString()),
    // it MUST be converted back to an ObjectId for MongoDB operations.
    const userId = new ObjectId(req.session.user.id); 

    try { 
        // --- STEP 1: CREATE A PENDING ORDER IN YOUR DB BEFORE GOING TO PAYSTACK --- 
        let productdata = await db.get_gb().collection('cart').find({ email: email }).toArray(); 
        if (productdata.length === 0) { 
            req.flash('error', 'Your cart is empty!'); 
            return res.redirect('/cart'); // Redirect if cart is empty 
        } 

        let totalAmount = +req.body.total; // Ensure total is a number 

        let currentdate = new Date(); 
        currentdate.setDate(currentdate.getDate() + 25); // Set arriving date to 25 days later
        // Format the date for display purposes
        let formatdate = currentdate.toLocaleDateString('en-US', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        }); 

        const order = { 
            user: { 
                _id: userId, // Use the ObjectId here for the MongoDB document
                email: email, 
                
            }, 
            productdata: productdata, 
            totalAmount: totalAmount, 
            status: 'pending', // Initial status: payment not yet confirmed 
            arriving_date: formatdate, 
            paystackRef: null, // This will be updated after successful verification 
            createdAt: new Date() // Timestamp for when the order was created 
        }; 

        const result = await db.get_gb().collection('order').insertOne(order); 
        const orderId = result.insertedId; // Get the ID of the newly created pending order 

        // --- STEP 2: PROCEED TO PAYSTACK INITIALIZATION --- 
        const params = JSON.stringify({ 
            "email": email, 
            "amount": totalAmount * 100, // Amount in kobo 
            "callback_url": `${process.env.APP_BASE_URL}/orders?orderId=${orderId.toString()}&total=${totalAmount}` // Pass orderId and total 
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
                            { _id: orderId },
                            { $set: { status: 'initialization_failed', failedAt: new Date(), paystackResponse: response } }
                        ).catch(err => console.error('Failed to update order status after Paystack init error:', err));

                        req.flash('error', response.message || 'Failed to initialize payment. Please try again.');
                        return res.redirect('/cart'); // Redirect back to checkout
                    }
                } catch (parseError) {
                    console.error('Error parsing Paystack response during initialization:', parseError);
                    // Mark the pending order as failed
                    db.get_gb().collection('order').updateOne(
                        { _id: orderId },
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
                { _id: orderId },
                { $set: { status: 'initialization_network_error', failedAt: new Date(), errorMessage: error.message } }
            ).catch(dbErr => console.error('Failed to update order status after network error:', dbErr));
            req.flash('error', 'Internal Server Error while contacting payment gateway. Please try again.');
            return res.redirect('/cart');
        });

        req_stack.write(params); // Send the request body
        req_stack.end(); // End the request - THIS IS CRUCIAL FOR PREVENTING HANGS!

    } catch (err) {
        console.error('Unhandled error during Paystack process:', err);
        next(err); // Pass any unexpected errors to Express error handler
    }
});

module.exports = router;