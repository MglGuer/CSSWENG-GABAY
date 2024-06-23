// Install Command
// npm init -y
// npm i express express-handlebars body-parser mongoose bcrypt connect-mongodb-session express-session moment


// example user | email: exampleuser1@gmail.com , password: password

const express = require('express');
const server = express();

const bodyParser = require('body-parser');
server.use(bodyParser.json());
server.use(express.json()); 
server.use(express.urlencoded({ extended: true }));

// handlebars
const handlebars = require('express-handlebars');
const moment = require('moment');   // to format date for login history in history log page
server.set('view engine', 'hbs');
server.engine('hbs', handlebars.engine({
    extname: 'hbs',
    helpers: {
        formatDate: function (date) {
            return moment(date).format('MMMM D, YYYY h:mm:ss A');
        },
        eq: (a, b) => a === b,
        or: (...args) => {
            args.pop(); 
            return args.some(arg => arg);
        },
        increment: function (value) {
            return value + 1;
        },
        decrement: function (value) {
            return value - 1;
        },
        gt: function (a, b) {
            return a > b;
        },
        lt: function (a, b) {
            return a < b;
        }
    },
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    }
}));

// access public folder
server.use(express.static('public'));

// bcrypt (Password Hashing)
const bcrypt = require('bcrypt');
const saltRounds = 10;

// session
const session = require('express-session');
 
// mongoDB
const { ServerApiVersion } = require('mongodb');
const mongoStore = require('connect-mongodb-session')(session);
const {MongoClient} = require("mongodb");
const mongoose = require('mongoose');
const uri = "mongodb+srv://vancerobles:ZgtbvnIiuXTeRxYB@gabay.uxaz23w.mongodb.net/";
const client = new MongoClient(uri, {
    serverApi:{
        version: ServerApiVersion.v1,
        stritct: false,
        deprecationErrors: true,
    }
});

async function connectToDatabase(){
    try{
        await client.connect();
        mongoose.connect(uri);
    }
    catch{
        console.error("Error connecting to MongoDB:", error);
        process.exit(1); // exit the process if there's an error connecting to MongoDB
    }
}

connectToDatabase();

const routes = require('./Controller/Controller.js');
server.use('/', routes);

function finalClose(){
    console.log('Close connection at the end!');
    mongoose.connection.close();
    process.exit();
}

process.on('SIGTERM',finalClose);  
process.on('SIGINT',finalClose);   
process.on('SIGQUIT', finalClose); 

const port = process.env.PORT | 3000;
server.listen(port, function(){
    console.log('Listening at port '+port);
});