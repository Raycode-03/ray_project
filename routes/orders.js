// orders.js (your current file)
require('dotenv').config();
const express = require('express');
const router = express.Router();
const db = require('../data/database');
const mongodb = require('mongodb');
const objectid = mongodb.ObjectId;
const https = require('https'); // Needed for Paystack verification API call

router.get('/orders', async (req, res, next) => {
    if (!res.locals.isauth) {
        return res.redirect('/login');
    }

    const paystackReference = req.query.reference; // Paystack sends this!
    const orderIdFromCallback = req.query.orderId; // You sent this in callback_url
    // const totalAmountFromCallback = req.query.total; // You might not need this explicitly here if Paystack verification gives i

    let email = req.session.user.email; // Get user email from session

    try {
        // --- Part 1: Handle Paystack Callback (if 'reference' is present) ---
        if (paystackReference && orderIdFromCallback) {
            const orderObjectId = new objectid(orderIdFromCallback);
            
            // --- CRITICAL STEP: SERVER-SIDE VERIFICATION WITH PAYSTACK ---
            const options = {
                hostname: 'api.paystack.co',
                port: 443,
                path: `/transaction/verify/${paystackReference}`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, // Your SECRET key
                }
            };

            const verify_req = https.request(options, verify_res => {
                let data = '';
                verify_res.on('data', (chunk) => { data += chunk; });
                verify_res.on('end', async () => {
                    try {
                        const response = JSON.parse(data);

                        if (response.status && response.data && response.data.status === 'success') {
                            // Payment was successful!
                            // 1. Update the order in your database
                            // Assuming req.session.user.id is already the string representation of the ObjectId
                          const updateResult= await db.get_gb().collection('order').updateOne(
                                { _id: orderObjectId, "user._id": new objectid(req.session.user.id) },
                                { $set: { status: 'completed', paystackref: paystackReference, paymentVerifiedAt: new Date() } }
                                
                            );
                            
                            // 2. Clear the user's cart
                            await db.get_gb().collection('cart').deleteMany({ email: email });

                            req.flash('success', 'Your order has been placed successfully and payment confirmed!');
                            // Store the ID of the confirmed order in session flash for highlighting if needed
                            req.flash('confirmedOrderId', orderIdFromCallback);

                            // Re-direct without the query parameters to clean up the URL
                            // and ensure the flash messages are rendered on the next request
                            return res.redirect('/orders'); 

                        } else {
                            // Payment was NOT successful (failed, abandoned, pending, etc.)
                            console.error('Paystack transaction verification failed for order:', orderIdFromCallback, response);
                            // Update order status to 'failed' or 'cancelled'
                            await db.get_gb().collection('order').updateOne(
                                { _id: orderObjectId, "user._id": new objectid(req.session.user.id) },
                                { $set: { status: 'failed', paystackref: paystackReference, paymentVerifiedAt: new Date(), failureReason: response.message || 'Payment failed' } }
                            );
                            req.flash('error', response.message || 'Payment was not successful. Please try again.');
                            // Re-direct without the query parameters
                            return res.redirect('/orders');
                        }
                    } catch (parseError) {
                        console.error('Error parsing Paystack verification response:', parseError);
                        req.flash('error', 'Error processing payment verification. Please contact support.');
                        return res.redirect('/orders'); // Re-direct without the query parameters
                    }
                });
            }).on('error', error => {
                console.error('Paystack verification request error:', error);
                req.flash('error', 'Could not verify payment with gateway. Please try again or contact support.');
                return res.redirect('/orders'); // Re-direct without the query parameters
            });

            verify_req.end(); // Don't forget this!
            return; // Exit here as the response will be handled in verify_req.on('end') or .on('error')
        }

        // --- Part 2: Display Order History (Runs after callback redirect, or on direct navigation) ---
        // This code will run after the redirect from the Paystack callback handler,
        // or if the user navigates directly to /orders.
        // The flash messages set above will be available here.

        let orders = await db.get_gb().collection('order').find({ "user.email": email }).sort({createdAt:-1}).toArray();
        
        // Retrieve flash messages (success/error/confirmedOrderId)
        const messages = req.flash(); // Get all flash messages
        const successMessage = messages.success ? messages.success[0] : null;
        const errorMessage = messages.error ? messages.error[0] : null;
        const confirmedOrderId = messages.confirmedOrderId ? messages.confirmedOrderId[0] : null;

        res.render('user/order', { 
            orders: orders,
            successMessage: successMessage,
            errorMessage: errorMessage,
            confirmedOrderId: confirmedOrderId // Pass this to potentially highlight the order
        });

    } catch (err) {
        console.error('Error fetching orders:', err);
        next(err); // Pass error to Express error handler
    }
});

// IMPORTANT: REMOVE OR RENAME YOUR router.post('/orders', ...)
// The order creation logic (to 'pending') should ONLY happen in your /paystack POST route.
// The finalization of the order (to 'completed') is now handled by the GET /orders verification.

module.exports = router;