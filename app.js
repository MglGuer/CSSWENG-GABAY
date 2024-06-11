//Install Command:
//npm init -y
//npm i express express-handlebars body-parser mongoose bcrypt connect-mongodb-session express-session 
// example user | email: exampleuser1@gmail.com , password: password

const express = require('express');
const server = express();

const bodyParser = require('body-parser');
server.use(express.json()); 
server.use(express.urlencoded({ extended: true }));

// handlebars
const handlebars = require('express-handlebars');
server.set('view engine', 'hbs');
server.engine('hbs', handlebars.engine({
    extname: 'hbs'
}));

// access public folder
server.use(express.static('public'));

//bcrypt (Password Hashing)
const bcrypt = require('bcrypt');
const saltRounds = 10;

//session
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

const patientSchema = new mongoose.Schema({
    barangay: { type: String },
    age_range: { type: String },
    gender: { type: String },
    tested_before: { type: Boolean },
    test_result: { type: String },
    reason: { type: String },
    kvp: { type: String },
    linkage: { type: String }
},{ versionKey: false });
  
const patientModel = mongoose.model('patient', patientSchema);

const userSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String },
    password: { type: String },
    role: { type:String },
    isAdmin: { type: Boolean },
},{ versionKey: false });

const userModel = mongoose.model('user', userSchema);

server.use(session({
    secret: 'gabay',
    saveUninitialized: true, 
    resave: true,
    username: "",
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


// server starts at login
server.get('/', (req,resp) => {

    if (req.session.username== undefined){
        resp.render('login',{
            layout: 'index',
            title: 'Login Page'
        });
    }else{
        resp.redirect('/dashboard'); //redirect to dashboard if session exists
    }
    
});

//login page
server.get('/login', (req,resp) => {
    resp.render('login',{
        layout: 'index',
        title: 'Login Page',
        failed: req.query.failed,
    });
});

// TODO: check user email and password by searching the database
server.post('/read-user', async (req,res) => {
    // get data from form
    const {email, password} = req.body;

    // get collection
    const userCollection = client.db("test").collection("users");

    // find matching email
    const user = await userCollection.findOne({ email: email});

    const match = await bcrypt.compare(password,user.password);

    // if authentication failed, show login failed
    if(!user || !match){
        // reload page with query
        return res.redirect('/login?error=User does not exists');
    }
    
    // TODO: add user into session
    req.session.username = user.name;
    req.session.email = user.email;
    req.session.role = user.role;
    
    // if authentication is successful, redirect to dashboard
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

// TODO: post user details into the database upon signing up
server.post('/create-user', async (req,res) => {

    // retrieve user details
    const {name, email, password} = req.body;

    // get db collection
    const userCollection = client.db("test").collection("users");
    
    // check if email is used in database
    const user = await userCollection.findOne({ email: email});

    if (user){
        // reload page with query
        return res.redirect("/signup?emailUsed=true");
    }

    // hash password used
    const hashedPassword = await new Promise((resolve, reject) => {
        bcrypt.hash(password, saltRounds, function(err, hash) {
          if (err) reject(err)
          resolve(hash)
        });
    })

    // insert data
    const result = await userCollection.insertOne({

        name: name,
        email: email,
        password: hashedPassword,
        role: 'Admin', 
        isAdmin: true 

    });

    // when successful, return to login page
    return res.redirect('/');

});

// server to push new patient data to db
server.post('/add-record', async (req, res) => {

    // retrieve details
    const {baranggay, gender, age, tested, result, linkage} = req.body
    const reason_hiv = req.body['reason-hiv']
    const vulnerable_population = req.body['vulnerable-population']

    const patientCollection = client.db("test").collection("patients"); // get db collection
    const tested_before = tested === 'tested-yes'; // convert to bool

    // insert data
    const record = await patientCollection.insertOne({

        barangay: baranggay,
        age_range: age,
        gender: gender,
        tested_before: tested_before,
        test_result: result,
        reason: reason_hiv,
        kvp: vulnerable_population,
        linkage: linkage

    });

    console.log("Data sucessfully added.")
    return res.redirect('/tracker?message=Patient Data Record added succesfully');
})

// server to change new password
server.get('/forgotpassword', (req,resp) => {
    resp.render('forgotpassword',{
        layout: 'index',
        title: 'Forgot Password Page'
    });
});

// server to post user's new password into the database when forgotten
server.post('/forgot-password', async (req, res) => {
    const { email, password, confirmPassword } = req.body;

    // check if passwords match
    if (password !== confirmPassword) {
        return res.redirect('/forgotpassword?error=Passwords do not match');
    }

    try {
        // get db collection
        const userCollection = client.db("test").collection("users");

        // find user by email
        const user = await userCollection.findOne({ email: email });

        if (!user) {
            return res.redirect('/forgotpassword?error=Email not found');
        }

        // hash the new password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // update the user's password in the database
        await userCollection.updateOne({ email: email }, { $set: { password: hashedPassword } });

        res.redirect('/login?message=Password updated successfully');
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).send("Internal Server Error");
    }
});

// server for dashboard
server.get('/dashboard', (req,resp) => {
    resp.render('dashboard',{
        layout: 'index',
        title: 'Dashboard Page',
        user: {
            name: req.session.username,
            email: req.session.email,
            role: req.session.role
        }
    });
});

// server for tracker
server.get('/tracker', (req,resp) => {
    resp.render('tracker',{
        layout: 'index',
        title: 'Data Tracker Page',
        user: {
            name: req.session.username,
            email: req.session.email,
            role: req.session.role
        }
    });
});

// server for profile
server.get('/profile', async (req, res) => {
    if (!req.session.email) {
        return res.redirect('/login');
    }

    try {
        // get db collection
        const userCollection = client.db("test").collection("users");
        const user = await userCollection.findOne({ email: req.session.email });

        if (!user) {
            return res.redirect('/login');
        }

        res.render('profile', {
            layout: 'index',
            title: 'Profile Page',
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
                isAdmin: user.isAdmin,
            }
        });
    } catch (error) {
        console.error("Error retrieving user data:", error);
        res.status(500).send("Internal Server Error");
    }
});

// 
server.post('/update-profile', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // get db collection
        const userCollection = client.db("test").collection("users");
        
        const updateFields = { name, email };

        if (password) {
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            updateFields.password = hashedPassword;
        }
        
        // update user data
        await userCollection.updateOne({ email: req.session.email }, { $set: updateFields });

        req.session.email = email; // update session email if changed
        res.redirect('/profile?message=User information updated successfully');
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).send("Internal Server Error");
    }
});


// server for history log
server.get('/history', (req,resp) => {
    resp.render('history',{
        layout: 'index',
        title: 'History Log Page',
        user: {
            name: req.session.username,
            email: req.session.email,
            role: req.session.role
        }
    });
});

// TODO: log out
server.get('/logout', (req,resp) => {

    req.session.destroy(function(err) {
        resp.redirect('/');
    });

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