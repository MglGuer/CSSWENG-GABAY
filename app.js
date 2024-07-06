// Install Command
// npm init -y
// npm i express express-handlebars body-parser mongoose bcrypt connect-mongodb-session express-session moment cloudinary

// User Credentials (Example)
// Member                       | email: member@gmail.com , password: testuser
// Data Encoder (Admin)         | email: dataencoder@gmail.com , password: dataencoder
// Data Manager (Super Admin)   | email: admin@gmail.com , password: admin123

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
const uri = "mongodb+srv://vancerobles:ZgtbvnIiuXTeRxYB@gabay.uxaz23w.mongodb.net/?retryWrites=true&w=majority&appName=GABAY";
const client = new MongoClient(uri, {
    serverApi:{
        version: ServerApiVersion.v1,
        stritct: false,
        deprecationErrors: true,
    }
});

var cloudinary = require('cloudinary').v2;

(async function() {
    // configuration
    cloudinary.config({ 
        cloud_name: 'dof7fh2cj', 
        api_key: '411879496332247', 
        api_secret: 'LEEZpzSauYJuHUzCmwQtL80HI5c' // Click 'View Credentials' below to copy your API secret
    }); 
})();

async function connectToDatabase(retries = 5, delay = 5000) {
    for (let i = 0; i < retries; i++) {
        try {
            await client.connect();
            mongoose.connect(uri);
            console.log("Connected to MongoDB successfully");
            break;
        } catch (err) {
            console.error(`Error connecting to MongoDB, retrying in ${delay / 1000} seconds...`, err);
            if (i === retries - 1) {
                console.error("All retries failed.");
                break;
            }
            await new Promise(res => setTimeout(res, delay));
        }
    }
}

connectToDatabase();

const { patientModel, userModel, loginHistoryModel, actionHistoryModel } = require('./Model/Model'); // Adjust the path as necessary

server.use(session({
    secret: 'gabay',
    saveUninitialized: true, 
    resave: true,
    username: "",
    store: new mongoStore({ 
      uri: uri,
      collection: 'sessionGabay',
      //expires: 1000*60*60 // 1 hour
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
    const user = await userCollection.findOne({ email: email });
    
    // if authentication failed, show login failed
    if(!user){
        // reload page with query
        return res.redirect('/login?error=User does not exist');
    }else{
        const match = await bcrypt.compare(password,user.password);
        if(!match){
            return res.redirect('/login?error=Invalid password');
        }
    }
    // insert login history data into the db
    const loginHistoryCollection = client.db("test").collection("loginhistories");
    await loginHistoryCollection.insertOne({
        name: user.name,
        role: user.role,
        email: user.email,
        lastLoginDateTime: new Date() 
    });
    
    if(req.body.remember == "true"){
        req.session.cookie.expires  = new Date(Date.now() + 1000*60*60*24*30);//thirty days
        //console.log(req.session.cookie.expires);
    }else{
        req.session.cookie.expires  = new Date(Date.now() + 1000*60*60);//one hour
        //console.log(req.session.cookie.expires);
    }

    // TODO: add user into session
    req.session.username = user.name;
    req.session.email = user.email;
    req.session.role = user.role;
    req.session.userIcon = user.userIcon;
    //console.log(req.body.remember);
    
    
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

// post user details into the database upon signing up
server.post('/create-user', async (req, res) => {
    // retrieve user details
    const { name, email, password, role} = req.body;

    // get db collection
    const userCollection = client.db("test").collection("users");
    
    // check if email is used in database
    const user = await userCollection.findOne({ email: email });

    if (user) {
        // reload page with query
        return res.redirect("/signup?emailUsed=true");
    }

    // hash password used
    const hashedPassword = await new Promise((resolve, reject) => {
        bcrypt.hash(password, saltRounds, function (err, hash) {
            if (err) reject(err);
            resolve(hash);
        });
    });

    // determine admin status based on role
    let isAdmin = false;
    if (role === 'Data Manager') {
        isAdmin = true;
    }

    // insert data into the db
    const result = await userCollection.insertOne({
        name: name,
        email: email,
        password: hashedPassword,
        role: role,
        isAdmin: isAdmin,
        userIcon: 'https://res.cloudinary.com/dof7fh2cj/image/upload/v1719207075/hagwnwmxbpkpczzyh46g.jpg'
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

// server for dashboard page
server.get('/dashboard', async (req, resp) => {
    try {
        // get db collection
        const patientCollection = client.db("test").collection("patients");

        // retrieve statistics from the patient collection
        const totalPatientsTested = await patientCollection.countDocuments();
        const biomedicalPatientsTested = await patientCollection.countDocuments({ data_type: 'Biomedical' });
        const nonbiomedicalPatientsTested = await patientCollection.countDocuments({ data_type: 'Nonbiomedical' });
        const positivePatientsTested = await patientCollection.countDocuments({ 'biomedical.test_result': 'Positive', data_type: 'Biomedical' });
        const negativePatientsTested = await patientCollection.countDocuments({ 'biomedical.test_result': 'Negative', data_type: 'Biomedical' });
        const dnkPatientsTested = await patientCollection.countDocuments({ 'biomedical.test_result': 'Do Not Know', data_type: 'Biomedical' });

        //getting available years
        const patient = await patientCollection.find().toArray();
        const year = patient.map(({date_encoded}) => date_encoded).map(function(date){return date.getFullYear()});
        
        resp.render('dashboard', {
            layout: 'index',
            title: 'Dashboard Page',
            user: {
                name: req.session.username,
                email: req.session.email,
                role: req.session.role,
                userIcon: req.session.userIcon
            },
            statistics: {
                totalPatientsTested: totalPatientsTested,
                biomedicalPatientsTested: biomedicalPatientsTested,
                nonbiomedicalPatientsTested: nonbiomedicalPatientsTested,
                positivePatientsTested: positivePatientsTested,
                negativePatientsTested: negativePatientsTested,
                dnkPatientsTested: dnkPatientsTested
            },
            year: year.filter((item,index) => year.indexOf(item) === index).sort((a,b)=>b-a)
        });
    } catch (error) {
        console.error("Error fetching dashboard statistics:", error);
        resp.status(500).send("Internal Server Error");
    }
});

// server to get data for the dashboard
server.get('/dashboard/data', async (req, resp) => {
    try {
        const patientCollection = client.db("test").collection("patients");
        const monthly = parseInt(req.query.monthly);
        const yearly = parseInt(req.query.yearly);
        console.log("monthly: " + monthly);
        console.log("yearly: " +yearly);

        //if there is monthly
        const filterMonth = monthly > 0 || monthly < 13?
        [
            {     
                $match: {
                    $expr:{$eq: ["$filterMonth",monthly]}
                }
            }
        ]
        : [];

        const filterYear = !isNaN(yearly)?
        [
            {     
                $match: {
                    $expr:{$eq: ["$filterYear",yearly]}
                }
            }
        ]
        : [];

        const data = await patientCollection.aggregate([
            {
                $addFields: {
                    filterMonth: {$month:"$date_encoded"},
                    filterYear: {$year:"$date_encoded"}
                }
            },
            ...filterMonth,
            ...filterYear,
            {$facet: {
                genderTestResult: 
                [
                    {
                        $group: { 
                            _id: { gender: "$gender", test_result: "$biomedical.test_result"},
                            count: { $sum: 1 } 
                        }
                    }
                ],
                
                reason: 
                [   
                    { 
                        $group: { 
                            _id: { gender: "$gender", test_result: "$biomedical.test_result", reason: "$biomedical.reason" }, 
                            count: { $sum: 1 } 
                        } 
                    }
                ],

                kvp: 
                [   
                    { 
                        $group: { 
                            _id: { gender: "$gender", test_result: "$biomedical.test_result", kvp: "$biomedical.kvp" }, 
                            count: { $sum: 1 } 
                        } 
                    }
                ],

                testedBefore: 
                [   
                    { 
                        $group: { 
                            _id: { gender: "$gender", test_result: "$biomedical.test_result", tested_before: "$biomedical.tested_before" }, 
                            count: { $sum: 1 } 
                        } 
                    }
                ],

                ageRange: 
                [   
                    { 
                        $group: { 
                            _id: { gender: "$gender", test_result: "$biomedical.test_result", age: "$biomedical.age_range" }, 
                            count: { $sum: 1 } 
                        } 
                    }
                ],

                linkage: 
                [
                    { 
                        $group: { 
                            _id: { gender: "$gender", test_result: "$biomedical.test_result", linkage: "$biomedical.linkage" }, 
                            count: { $sum: 1 } 
                        } 
                    }
                ],
                stigma: 
                [   
                    { 
                        $group: { 
                            _id: { gender: "$gender", stigma: "$nonbiomedical.stigma" }, 
                            count: { $sum: 1 } 
                        }
                    }
                ],

                discrimination: 
                [   
                    { 
                        $group: { _id: { gender: "$gender", discrimination: "$nonbiomedical.discrimination" }, 
                        count: { $sum: 1 } 
                        } 
                    }
                ],
                
                violence: 
                [   
                    { 
                        $group: { _id: { gender: "$gender", violence: "$nonbiomedical.violence" }, 
                        count: { $sum: 1 } 
                        } 
                    }
                ]
            }}
        ]).toArray();


        resp.json({data: data[0]}); 
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        resp.status(500).json({ error: "Internal Server Error" });
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
            role: req.session.role,
            userIcon: req.session.userIcon
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

        if (data_type === 'Biomedical') {
            patientData.biomedical = {
                location: location,
                barangay: barangay,
                remarks: remarks,
                age_range: age,
                tested_before: tested,
                test_result: result,
                reason: reason_hiv,
                kvp: vulnerable_population,
                linkage: linkage
            };
        } else if (data_type === 'Nonbiomedical') {
            patientData.nonbiomedical = {
                stigma: stigma,
                discrimination: discrimination,
                violence: violence
            };
        }

        const newPatient = new patientModel(patientData);
        await newPatient.save();

        // insert action history
        const actionHistoryCollection = mongoose.connection.collection('actionhistories');
        await actionHistoryCollection.insertOne({
            name: req.session.username,
            role: req.session.role,
            email: req.session.email,
            icon: req.session.userIcon,
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
    res.render('profile', {
        layout: 'index',
        title: 'Profile Page',
        user: {
            name: req.session.username,
            email: req.session.email,
            role: req.session.role,
            userIcon: req.session.userIcon
        }
    });
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
        req.session.username = name; 

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
        const loginHistoryCollection = client.db("test").collection("loginhistories");
        const actionHistoryCollection = client.db("test").collection("actionhistories");

        const pageSize = 10; // number of records per page

        // get page number for login history
        const loginPage = parseInt(req.query.loginPage) || 1;
        const loginHistorySkip = (loginPage - 1) * pageSize;

        // get page number for action history
        const actionPage = parseInt(req.query.actionPage) || 1;
        const actionHistorySkip = (actionPage - 1) * pageSize;

        // get paginated login history sorted by most recent first
        const loginHistory = await loginHistoryCollection.find().sort({ lastLoginDateTime: -1 }).skip(loginHistorySkip).limit(pageSize).toArray();
        
        // get paginated action history sorted by most recent first
        const actionHistory = await actionHistoryCollection.find().sort({ actionDateTime: -1 }).skip(actionHistorySkip).limit(pageSize).toArray();

        res.render('history', {
            layout: 'index',
            title: 'History Log Page',
            user: {
                name: req.session.username,
                email: req.session.email,
                role: req.session.role,
                userIcon: req.session.userIcon
            },
            loginHistory: loginHistory,
            actionHistory: actionHistory,
            loginPage: loginPage,
            actionPage: actionPage,
            loginTotalPages: Math.ceil(await loginHistoryCollection.countDocuments() / pageSize),
            actionTotalPages: Math.ceil(await actionHistoryCollection.countDocuments() / pageSize)
        });
    } catch (error) {
        console.error("Error fetching history:", error);
        res.status(500).send("Internal Server Error");
    }
});

// server for data log
server.get('/data', async (req, res) => {
    try {
        const pageSize = 10;
        const biomedicalPage = parseInt(req.query.biomedicalPage) || 1;
        const nonBiomedicalPage = parseInt(req.query.nonBiomedicalPage) || 1;

        const patients = await patientModel.find().exec();
        const biomedicalPatients = patients.filter(patient => patient.data_type === 'Biomedical');
        const nonBiomedicalPatients = patients.filter(patient => patient.data_type === 'Nonbiomedical');

        const paginatedBiomedicalPatients = biomedicalPatients.slice((biomedicalPage - 1) * pageSize, biomedicalPage * pageSize);
        const paginatedNonBiomedicalPatients = nonBiomedicalPatients.slice((nonBiomedicalPage - 1) * pageSize, nonBiomedicalPage * pageSize);

        const biomedicalCount = biomedicalPatients.length;
        const nonBiomedicalCount = nonBiomedicalPatients.length;

        res.render('data', { 
            layout: 'index',
            title: 'Data Log Page',
            user: {
                name: req.session.username,
                email: req.session.email,
                role: req.session.role,
                userIcon: req.session.userIcon
            },
            paginatedBiomedicalPatients, 
            paginatedNonBiomedicalPatients,
            biomedicalCount,
            nonBiomedicalCount,
            biomedicalPage,
            nonBiomedicalPage,
            biomedicalTotalPages: Math.ceil(biomedicalCount / pageSize),
            nonBiomedicalTotalPages: Math.ceil(nonBiomedicalCount / pageSize)
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// server for editing patient data record
server.get('/edit/:id', async (req, res) => {
    try {
        const patient = await patientModel.findById(req.params.id);
        res.json({ patient: patient });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// server for updating a patient record
server.post('/edit/:id', async (req, res) => {
    try {
        const { gender, location, barangay, remarks, age_range, tested_before, test_result, reason, kvp, linkage, stigma, discrimination, violence } = req.body;
        await patientModel.findByIdAndUpdate(req.params.id, {
            gender: gender,
            'biomedical.location': location,
            'biomedical.barangay': barangay,
            'biomedical.remarks': remarks,
            'biomedical.age_range': age_range,
            'biomedical.tested_before': tested_before,
            'biomedical.test_result': test_result,
            'biomedical.reason': reason,
            'biomedical.kvp': kvp,
            'biomedical.linkage': linkage,
            'nonbiomedical.stigma': stigma,
            'nonbiomedical.discrimination': discrimination,
            'nonbiomedical.violence': violence
        });

        const actionHistoryCollection = client.db("test").collection("actionhistories");
        
        // insert action history for deleting patient record
        await actionHistoryCollection.insertOne({
            name: req.session.username,
            role: req.session.role,
            email: req.session.email,
            action: "Edited patient record",
            actionDateTime: new Date()
        });
        res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// server for deleting a patient data record 
server.get('/delete/:id', async (req, res) => {
    try {
        await patientModel.findByIdAndDelete(req.params.id);
        const actionHistoryCollection = client.db("test").collection("actionhistories");
        
        // insert action history for deleting patient record
        await actionHistoryCollection.insertOne({
            name: req.session.username,
            role: req.session.role,
            email: req.session.email,
            action: "Deleted patient record",
            actionDateTime: new Date()
        });
        res.redirect('/data');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// TODO: log out
server.get('/logout', (req,resp) => {

    req.session.destroy((err) => {
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