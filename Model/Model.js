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
    data_type: { 
        type: String, 
        required: true,
        enum: ['biomedical', 'nonbiomedical']
    },
    gender: { 
        type: String,
        enum: ['Male', 'Female', 'Transgender']
    },
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
    role: { 
        type: String,
        enum: ['Member', 'Data Encoder', 'Data Manager']
    },
    isAdmin: { type: Boolean },
    userIcon: {type: String}
},{ versionKey: false });

// schema for login history
const loginHistorySchema = new mongoose.Schema({
    name: { type: String },
    role: { 
        type: String,
        enum: ['Member', 'Data Encoder', 'Data Manager']
    },
    email: { type: String },
    lastLoginDateTime: { type: Date, default: Date.now }
},{ versionKey: false });

// schema for action history
const actionHistorySchema = new mongoose.Schema({
    name: { type: String },
    role: { 
        type: String,
        enum: ['Member', 'Data Encoder', 'Data Manager']
    },
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
    patientModel: mongoose.model('Patient', patientSchema),
    userModel: mongoose.model('User', userSchema),
    loginHistoryModel: mongoose.model('LoginHistory', loginHistorySchema),
    actionHistoryModel: mongoose.model('ActionHistory', actionHistorySchema)
};




