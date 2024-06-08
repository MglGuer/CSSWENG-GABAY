//Install Command:
//npm init -y
//npm i express express-handlebars body-parser mongoose bcrypt connect-mongodb-session express-session 

const express = require('express');
const server = express();

const bodyParser = require('body-parser');
server.use(express.json()); 
server.use(express.urlencoded({ extended: true }));
//Handlebars
const handlebars = require('express-handlebars');
server.set('view engine', 'hbs');
server.engine('hbs', handlebars.engine({
    extname: 'hbs'
}));
//Access public folder
server.use(express.static('public'));
//Bcrypt (Password Hashing)
const bcrypt = require('bcrypt');
const saltRounds = 10;
//session
const session = require('express-session');
//MongoDB
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
        process.exit(1); // Exit the process if there's an error connecting to MongoDB
    }
}

const patientSchema = new mongoose.Schema({
    barangay: { type: String },
    age_range: { type: Number },
    tested_before: {type: Boolean},
    test_result: {type: String},
    reason: {type: String},
    kvp: {type: String},
    linkage: {type: String}
},{ versionKey: false });
  
const patientModel = mongoose.model('patient', patientSchema);

const userSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String },
    password: {type: String},
    isAdmin: { type: Boolean },
},{ versionKey: false });

const userModel = mongoose.model('user', userSchema);

server.use(session({
    secret: 'gabay',
    saveUninitialized: true, 
    resave: true,
    store: new mongoStore({ 
      uri: uri,
      collection: 'sessionGabay',
      expires: 1000*60*60 // 1 hour
    })
}));

server.get('/session/destroy', function(req, resp) {
    req.session.destroy();
    resp.status(200).send('ok');
});

function errorFn(err){
    console.log('Error found. Please trace!');
    console.error(err);
}

server.use(express.static(__dirname + '/public'));

//server starts at login
server.get('/', (req,resp) => {
    resp.render('login',{
        layout: 'index',
        title: 'Login Page'
    });
});

//login page
server.get('/login', (req,resp) => {
    resp.render('login',{
        layout: 'index',
        title: 'Login Page',
        failed:req.query.failed,
    });
});

//TODO: check user email and password by searching the database
server.post('/read-user', async (req,res) => {
    //get data from form
    const {email, password} = req.body;

    //get collection
    const userCollection = client.db("test").collection("users");

    //find matching email
    const user = await userCollection.findOne({ email: email});

    const match = await bcrypt.compare(password,user.password);

    //if authentication failed, show login failed
    if(!user || !match){
        //reload page with query
        return res.redirect('/login?failed=true');
    }
    
    //TODO: add user into session
    
    //if authentication is successful, redirect to dashboard
    res.redirect('/dashboard');
    
});

// server to register new account
server.get('/signup', (req,resp) => {
    resp.render('signup',{
        layout: 'index',
        title: 'Registration Page',
        emailUsed:req.query.emailUsed,
    });
});

//TODO: post user details into the database upon signing up
server.post('/create-user', async (req,res) => {

    //retrieve user details
    const {name, email, password} = req.body;

    //get db collection
    const userCollection = client.db("test").collection("users");
    
    //check if email is used in database
    const user = await userCollection.findOne({ email: email});

    if (user){
        //reload page with query
        return res.redirect("/signup?emailUsed=true");
    }

    //hash password used
    const hashedPassword = await new Promise((resolve, reject) => {
        bcrypt.hash(password, saltRounds, function(err, hash) {
          if (err) reject(err)
          resolve(hash)
        });
    })

    //insert data
    const result = await userCollection.insertOne({

        name: name,
        email: email,
        password: hashedPassword,
        isAdmin: false,

    });

    //when successful, return to login page
    return res.redirect('/');

});

// server to change new password
server.get('/forgotpassword', (req,resp) => {
    resp.render('forgotpassword',{
        layout: 'index',
        title: 'Forgot Password Page'
    });
});

// server for dashboard
server.get('/dashboard', (req,resp) => {
    resp.render('dashboard',{
        layout: 'index',
        title: 'Dashboard Page'
    });
});

// server for tracker
server.get('/tracker', (req,resp) => {
    resp.render('tracker',{
        layout: 'index',
        title: 'Data Tracker Page'
    });
});

// server for profile
server.get('/profile', (req,resp) => {
    resp.render('profile',{
        layout: 'index',
        title: 'Profile Page'
    });
});

// server for history log
server.get('/history', (req,resp) => {
    resp.render('history',{
        layout: 'index',
        title: 'History Log Page'
    });
});

//TODO: log out
server.get('logout', (req,res) => {



})

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