/* This file should include the CRUD operations needed for the Schemas */
/* This file is used to communicate with the database */
/* The previous functions that were in app.js were not changed so it
   need to be changed so that
*/

const mongoose = require('mongoose');

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

const userSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String },
    password: { type: String },
    role: { type:String },
    isAdmin: { type: Boolean },
},{ versionKey: false });

const loginHistorySchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String },
    lastLoginDateTime: { type: Date, default: Date.now }
},{ versionKey: false });

const actionHistorySchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String },
    action: { type: String },
    actionDateTime: { type: Date, default: Date.now }
},{ versionKey: false });

const patientModel = mongoose.model('patient', patientSchema);
const userModel = mongoose.model('user', userSchema);
const loginHistoryModel = mongoose.model('LoginHistory', loginHistorySchema);
const actionHistoryModel = mongoose.model('ActionHistory', actionHistorySchema);

/* These are the ones to be used in the controller */
module.exports = {
    Patient: mongoose.model('Patient', patientSchema),
    User: mongoose.model('User', userSchema),
    LoginHistory: mongoose.model('LoginHistory', loginHistorySchema),
    ActionHistory: mongoose.model('ActionHistory', actionHistorySchema)
};



/* 
    The CRUD functions should be placed here as well as data validation.

*/




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