const express = require('express');
const router = express.Router();
const https = require('https');
router.post('/paystack', (req, res, next) => {
    const params = JSON.stringify({
        "email": req.session.user.email,
        "amount": req.body.total *100,
        "callback_url": "https://60c1-102-90-96-242.ngrok-free.app/orders?total=amount"
        });

    const options = {
        hostname: 'api.paystack.co',
        port: 443,
        path: '/transaction/initialize',
        method: 'POST',
        headers: {
            Authorization: 'Bearer sk_test_338760261b361e29213e6858e104c5755f24326c',
            'Content-Type': 'application/json'
        }
    };

    const req_stack = https.request(options, res_stack => {
        let data = '';

        res_stack.on('data', (chunk) => {
            data += chunk;
        });

        res_stack.on('end', () => {
            const response = JSON.parse(data);
            if (response.status && response.data.authorization_url) {
                // Redirect the user to the Paystack payment page
                res.redirect(response.data.authorization_url);
            } else {
                // Handle error
                res.status(500).send('Failed to initialize transaction');
            }
        });
    }).on('error', error => {
        console.error(error);
        res.status(500).send('Internal Server Error');
    });

    req_stack.write(params);
    req_stack.end();
});

module.exports = router;