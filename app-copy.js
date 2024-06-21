// Install Command
// npm init -y
// npm i express express-handlebars body-parser mongoose bcrypt connect-mongodb-session express-session moment


// example user | email: exampleuser1@gmail.com , password: password

const express = require('express');
const server = express();

const bodyParser = require('body-parser');
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
            return moment(date).format('MM/DD/YYYY, h:mm:ss A');
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

// sub-schema for biomedical data
const biomedicalSchema = new mongoose.Schema({
    location: { type: String },
    barangay: { type: Number },
    remarks: { type: String },
    age_range: { type: String },
    tested_before: { type: Boolean },
    test_result: { type: String },
    reason: { type: String },
    kvp: { type: String },
    linkage: { type: String }
}, { _id: false });

// sub-schema for non-biomedical data
const nonBiomedicalSchema = new mongoose.Schema({
    stigma: { type: String },
    discrimination: { type: String },
    violence: { type: String }
}, { _id: false });

// main schema
const patientSchema = new mongoose.Schema({
    data_type: { type: String, required: true },
    gender: { type: String },
    biomedical: biomedicalSchema,
    nonbiomedical: nonBiomedicalSchema,
    encoder: { type: String },
    date_encoded: { type: Date, default: Date.now}
}, { versionKey: false });
  
const patientModel = mongoose.model('patient', patientSchema);

const userSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String },
    password: { type: String },
    role: { type:String },
    isAdmin: { type: Boolean },
},{ versionKey: false });

const userModel = mongoose.model('user', userSchema);

const loginHistorySchema = new mongoose.Schema({
    name: { type: String },
    role: { type: String },
    email: { type: String },
    lastLoginDateTime: { type: Date, default: Date.now }
},{ versionKey: false });

const loginHistoryModel = mongoose.model('LoginHistory', loginHistorySchema);

const actionHistorySchema = new mongoose.Schema({
    name: { type: String },
    role: { type: String },
    email: { type: String },
    action: { type: String },
    actionDateTime: { type: Date, default: Date.now }
},{ versionKey: false });

const actionHistoryModel = mongoose.model('ActionHistory', actionHistorySchema);

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

// login page
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
        return res.redirect('/login?error=User does not exist');
    }

    // insert login history data into the db
    const loginHistoryCollection = client.db("test").collection("loginhistories");
    await loginHistoryCollection.insertOne({
        name: user.name,
        role: user.role,
        email: user.email,
        lastLoginDateTime: new Date() 
    });
    
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

    // insert data into the db
    const result = await userCollection.insertOne({
        name: name,
        email: email,
        password: hashedPassword,
        role: 'Member', 
        isAdmin: false 
    });

    // when successful, return to login page
    return res.redirect('/');

});

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
server.get('/dashboard', async (req, resp) => {
    try {
        // get db collection
        const patientCollection = client.db("test").collection("patients");

        // retrieve statistics from the patient collection
        const totalPatientsTested = await patientCollection.countDocuments();
        const positivePatientsTested = await patientCollection.countDocuments({ test_result: 'positive' });
        const negativePatientsTested = await patientCollection.countDocuments({ test_result: 'negative' });

        resp.render('dashboard', {
            layout: 'index',
            title: 'Dashboard Page',
            user: {
                name: req.session.username,
                email: req.session.email,
                role: req.session.role
            },
            statistics: {
                totalPatientsTested: totalPatientsTested,
                positivePatientsTested: positivePatientsTested,
                negativePatientsTested: negativePatientsTested
            }
        });
    } catch (error) {
        console.error("Error fetching dashboard statistics:", error);
        res.status(500).send("Internal Server Error");
    }
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

// server to push new patient data to db
server.post('/add-record', async (req, res) => {
    const { data_type, gender, location, barangay, remarks, age,
        tested, result, linkage, stigma, discrimination, violence } = req.body;

    const reason_hiv = req.body['reason-hiv'];
    const vulnerable_population = req.body['vulnerable-population'];

    try {
        const patientData = {
            data_type: data_type,
            gender: gender,
            date_encoded: new Date(),
            encoder: req.session.username
        };

        if (data_type === 'biomedical') {
            patientData.biomedical = {
                location: location,
                barangay: barangay,
                remarks: remarks,
                age_range: age,
                tested_before: tested === 'tested-yes',
                test_result: result,
                reason: reason_hiv,
                kvp: vulnerable_population,
                linkage: linkage
            };
        } else if (data_type === 'nonbiomedical') {
            patientData.nonbiomedical = {
                stigma: stigma,
                discrimination: discrimination,
                violence: violence
            };
        }

        const newPatient = new patientModel(patientData);
        await newPatient.save();

        // Insert action history
        const actionHistoryCollection = mongoose.connection.collection('actionhistories');
        await actionHistoryCollection.insertOne({
            name: req.session.username,
            role: req.session.role,
            email: req.session.email,
            action: "Add new patient record",
            actionDateTime: new Date()
        });

        console.log("Patient data successfully added");
        return res.redirect('/tracker?message=Patient Data Record added successfully');
    } catch (err) {
        console.error("Error adding patient data:", err);
        return res.status(500).send("Error adding patient data");
    }
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

// server for updating user's information in profile page
server.post('/update-profile', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // get db collection
        const userCollection = client.db("test").collection("users");
        const loginHistoryCollection = client.db("test").collection("loginhistories");
        const actionHistoryCollection = client.db("test").collection("actionhistories");
        
        const updateFields = { name, email };

        if (password) {
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            updateFields.password = hashedPassword;
        }
        
        // update user data
        await userCollection.updateOne({ email: req.session.email }, { $set: updateFields });

        // update session email if changed
        req.session.email = email; 

        // update login history with new user information
        await loginHistoryCollection.updateMany({ email: req.session.email }, { $set: { email: email, name: name } });
        
        // update action history with new user information
        await actionHistoryCollection.updateMany( { email: req.session.email }, { $set: { email: email, name: name } });
        
        // insert action history for updating user profile
        await actionHistoryCollection.insertOne({
            name: name,
            role: req.session.role,
            email: email,
            action: "Update profile information",
            actionDateTime: new Date()
        });

        res.redirect('/profile?message=User information updated successfully');
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).send("Internal Server Error");
    }
});

// server for history log
server.get('/history', async (req, res) => {
    try {
        // get db collection
        const loginHistoryCollection = client.db("test").collection("loginhistories");
        const actionHistoryCollection = client.db("test").collection("actionhistories");

        // fetch login and action history documents
        const loginHistory = await loginHistoryCollection.find().toArray();
        const actionHistory = await actionHistoryCollection.find().toArray();

        res.render('history', {
            layout: 'index',
            title: 'History Log Page',
            user: {
                name: req.session.username,
                email: req.session.email,
                role: req.session.role
            },
            loginHistory: loginHistory,
            actionHistory: actionHistory
        });
    } catch (error) {
        console.error("Error fetching login history:", error);
        res.status(500).send("Internal Server Error");
    }
});

// server for data log
server.get('/data', async (req, res) => {
    try {
        const patients = await patientModel.find().exec();
        const biomedicalPatients = patients.filter(patient => patient.data_type === 'biomedical');
        const nonBiomedicalPatients = patients.filter(patient => patient.data_type === 'nonbiomedical');
  
      res.render('data', { 
        layout: 'index',
        title: 'Data Log Page',
        patients,
        biomedicalPatients, 
        nonBiomedicalPatients 
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
});
  
// edit patient record 
server.get('/edit/:id', async (req, res) => {
    try {
        const patient = await patientModel.findById(req.params.id);
        res.render('edit', { patient: patient });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// update patient record 
server.post('/edit/:id', async (req, res) => {
    try {
        const { gender, barangay, remarks, age_range, tested_before, test_result, reason, kvp, linkage, stigma, discrimination, violence } = req.body;
        await patientModel.findByIdAndUpdate(req.params.id, {
            gender: gender,
            barangay: barangay,
            remarks: remarks,
            age_range: age_range,
            tested_before: tested_before === 'true', // Convert to Boolean
            test_result: test_result,
            reason: reason,
            kvp: kvp,
            linkage: linkage,
            stigma: stigma,
            discrimination: discrimination,
            violence: violence
        });
        res.redirect('/data'); 
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// delete patient record 
server.get('/delete/:id', async (req, res) => {
    try {
        await patientModel.findByIdAndRemove(req.params.id);
        res.redirect('/data');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
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