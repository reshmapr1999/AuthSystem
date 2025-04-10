const mongoose = require("mongoose");
require('dotenv').config(); // Load environment variables from .env file


//connect to DB
const dbUrl = process.env.MONGO_URI;
mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

//acquire the connection
const db = mongoose.connection;

//error
db.on('error',console.error.bind(console, 'Error Connecting Database'));

db.once('open', function(){
    console.log("successfully connected to Database")
});


module.exports = mongoose;