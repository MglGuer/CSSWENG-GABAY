/* This file should include the CRUD operations needed for the Schemas */
/* This file is used to communicate with the database */
/* The previous functions that were in app.js were not changed so it
   need to be changed so that
*/

const mongoose = require('mongoose');

// sub-schema for patient if the data is a biomedical patient record
const biomedicalSchema = new mongoose.Schema({
    location: { type: String },
    barangay: { type: Number },
    remarks: { type: String },
    age_range: { type: String },
    tested_before: { type: String },
    test_result: { type: String },
    reason: { type: String },
    kvp: { type: String },
    linkage: { type: String }
}, { _id: false });

// sub-schema for patient if the data is a nonbiomedical patient record
const nonBiomedicalSchema = new mongoose.Schema({
    stigma: { type: String },
    discrimination: { type: String },
    violence: { type: String }
}, { _id: false });

// main schema for patient
const patientSchema = new mongoose.Schema({
    data_type: { type: String, required: true },
    gender: { type: String },
    biomedical: biomedicalSchema,
    nonbiomedical: nonBiomedicalSchema,
    encoder: { type: String },
    date_encoded: { type: Date, default: Date.now}
}, { versionKey: false });

// schema for user
const userSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String },
    password: { type: String },
    role: { type:String },
    isAdmin: { type: Boolean },
},{ versionKey: false });

// schema for login history
const loginHistorySchema = new mongoose.Schema({
    name: { type: String },
    role: { type: String },
    email: { type: String },
    lastLoginDateTime: { type: Date, default: Date.now }
},{ versionKey: false });

// schema for action history
const actionHistorySchema = new mongoose.Schema({
    name: { type: String },
    role: { type: String },
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

// check user email and password by searching the database
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

// post user details into the database upon signing up
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
        const actionHistoryCollection = mongoose.connection.collection('actionhistories');

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
            await actionHistoryCollection.insertOne({
                name: req.session.username,
                role: req.session.role,
                email: req.session.email,
                action: "Add new biomedical patient record",
                actionDateTime: new Date()
            });
        } else if (data_type === 'nonbiomedical') {
            patientData.nonbiomedical = {
                stigma: stigma,
                discrimination: discrimination,
                violence: violence
            };
            await actionHistoryCollection.insertOne({
                name: req.session.username,
                role: req.session.role,
                email: req.session.email,
                action: "Add new nonbiomedical patient record",
                actionDateTime: new Date()
            });
        }

        const newPatient = new patientModel(patientData);
        await newPatient.save();

        console.log("Patient data successfully added");
        return res.redirect('/tracker?message=Patient Data Record added successfully');
    } catch (err) {
        console.error("Error adding patient data:", err);
        return res.status(500).send("Error adding patient data");
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
        
        // insert action history for editing patient record
        await actionHistoryCollection.insertOne({
            name: req.session.username,
            role: req.session.role,
            email: req.session.email,
            action: "Edited patient data record",
            actionDateTime: new Date()
        });
        res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
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
            email: email,
            action: "Updated profile information",
            actionDateTime: new Date()
        });

        res.redirect('/profile?message=User information updated successfully');
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).send("Internal Server Error");
    }
});