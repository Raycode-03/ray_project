require('dotenv').config(); 
const cloudinary = require('cloudinary').v2;
const chokidar = require('chokidar');
const path = require('path');

    // Configuration
    cloudinary.config({ 
        cloud_name: 'dkolikr3y', 
        api_key: process.env.cloudinary_api_key, 
        api_secret: process.env.cloudinary_api_secret
    });

module.exports=cloudinary