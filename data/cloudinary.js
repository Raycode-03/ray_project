const cloudinary = require('cloudinary').v2;
const chokidar = require('chokidar');
const path = require('path');

    // Configuration
    cloudinary.config({ 
        cloud_name: 'dkolikr3y', 
        api_key: '471643152535881', 
        api_secret: 'UXb8Itxls8torhtVdylFMZbG5Hc'
    });

module.exports=cloudinary