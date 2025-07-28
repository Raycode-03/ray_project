// Require and configure dotenv to load variables from .env file
require('dotenv').config(); 
const mongodb=require('mongodb');
const mongodbclient=mongodb.MongoClient
let database;
// let mongodb_url='mongodb://localhost:27017';
// using enviroment variables
if(process.env.MONGODB_URL){
    mongodb_url=process.env.MONGODB_URL;
}
if (!mongodb_url) {
    throw new Error('MONGODB_URL environment variable is not set!');
}
async function connect(){
  const client= await mongodbclient.connect(mongodb_url);
  database=client.db('ray');
}
function get_gb(){
    if(!database){
        throw {message:"database not established"}
    }
    return database
}
module.exports={
    connect_db:connect,
    get_gb:get_gb
}
