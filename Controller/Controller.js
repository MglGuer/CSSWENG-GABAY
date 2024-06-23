/* This file is for handling routes (those with '/'  */
/* This is used to receive requests from the views and is the one sending
   the request to the model */
/* This shouldn't handle the CRUD operations nor data validation so there 
   should be changes in the code. This is pretty much the backend part for 
   the routes.*/

const express = require('express');
const server = express();

const bodyParser = require('body-parser');
server.use(bodyParser.json());
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

// server for checking user email and password by searching the database
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
            return res.redirect('/login?error=User does not exist');
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
    
    // TODO: add user into session
    req.session.username = user.name;
    req.session.email = user.email;
    req.session.role = user.role;
    
    // if authentication is successful, redirect to dashboard
    res.redirect('/dashboard');
    
});

// server for logging out
server.get('/logout', (req,resp) => {

    req.session.destroy(function(err) {
        resp.redirect('/');
    });

})

// server to register new account
server.get('/signup', (req,resp) => {
    resp.render('signup',{
        layout: 'index',
        title: 'Registration Page',
        emailUsed:req.query.emailUsed,
    });
});

// server for saving user details into the database upon signing up
server.post('/create-user', async (req, res) => {
    // retrieve user details
    const { name, email, password, role } = req.body;

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
        isAdmin: isAdmin
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

// server to save user's new password into the database when forgotten
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
        const positivePatientsTested = await patientCollection.countDocuments({ 'biomedical.test_result': 'Positive', data_type: 'biomedical' });
        const negativePatientsTested = await patientCollection.countDocuments({ 'biomedical.test_result': 'Negative', data_type: 'biomedical' });
        const nonbiomedicalPatientsTested = await patientCollection.countDocuments({ data_type: 'nonbiomedical' });

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
                negativePatientsTested: negativePatientsTested,
                nonbiomedicalPatientsTested: nonbiomedicalPatientsTested
            }
        });
    } catch (error) {
        console.error("Error fetching dashboard statistics:", error);
        res.status(500).send("Internal Server Error");
    }
});

// server for tracker page
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
                tested_before: tested,
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

        // insert action history
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

// server for data log page
server.get('/data', async (req, res) => {
    try {
        const pageSize = 10;   // number of records per page

        // parsing page numbers from query parameters or default to 1
        const biomedicalPage = parseInt(req.query.biomedicalPage) || 1;
        const nonBiomedicalPage = parseInt(req.query.nonBiomedicalPage) || 1;

        // get db collection
        const patients = await patientModel.find().exec();

        // filter patients into biomedical and non-biomedical categories
        const biomedicalPatients = patients.filter(patient => patient.data_type === 'biomedical');
        const nonBiomedicalPatients = patients.filter(patient => patient.data_type === 'nonbiomedical');

        // paginate biomedical and non-biomedical patients based on page numbers
        const paginatedBiomedicalPatients = biomedicalPatients.slice((biomedicalPage - 1) * pageSize, biomedicalPage * pageSize);
        const paginatedNonBiomedicalPatients = nonBiomedicalPatients.slice((nonBiomedicalPage - 1) * pageSize, nonBiomedicalPage * pageSize);

        // count total number of biomedical and non-biomedical patient data records
        const biomedicalCount = biomedicalPatients.length;
        const nonBiomedicalCount = nonBiomedicalPatients.length;

        res.render('data', { 
            layout: 'index',
            title: 'Data Log Page',
            user: {
                name: req.session.username,
                email: req.session.email,
                role: req.session.role
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

// server for editing a patient record
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

// server for deleting a patient record 
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

// server for profile page
server.get('/profile', async (req, res) => {
    res.render('profile', {
        layout: 'index',
        title: 'Profile Page',
        user: {
            name: req.session.username,
            email: req.session.email,
            role: req.session.role,
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
                role: req.session.role
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