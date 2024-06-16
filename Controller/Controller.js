/* This file is for handling routes (those with '/'  */
/* This is used to receive requests from the views and is the one sending
   the request to the model */
/* This shouldn't handle the CRUD operations nor data validation so there 
   should be changes in the code. This is pretty much the backend part for 
   the routes.*/

const express = require('express');
const server = express();

const bodyParser = require('body-parser');
server.use(express.json()); 
server.use(express.urlencoded({ extended: true }));
server.use(express.static('Model'));


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


// server to register new account
server.get('/signup', (req,resp) => {
    resp.render('signup',{
        layout: 'index',
        title: 'Registration Page',
        emailUsed:req.query.emailUsed,
    });
});

// server to change new password
server.get('/forgotpassword', (req,resp) => {
    resp.render('forgotpassword',{
        layout: 'index',
        title: 'Forgot Password Page'
    });
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

// TODO: log out
server.get('/logout', (req,resp) => {

    req.session.destroy(function(err) {
        resp.redirect('/');
    });

})


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

// server to push new patient data to db
server.post('/add-record', async (req, res) => {

    // retrieve details
    const { baranggay, gender, age, tested, result, linkage } = req.body
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

    // insert action history for adding new patient record
    const actionHistoryCollection = client.db("test").collection("actionhistories");
    await actionHistoryCollection.insertOne({
        name: req.session.username,
        email: req.session.email,
        action: "Add new patient record",
        actionDateTime: new Date()
    });

    console.log("Data sucessfully added.")
    return res.redirect('/tracker?message=Patient Data Record added succesfully');
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