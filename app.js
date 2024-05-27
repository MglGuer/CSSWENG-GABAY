//Install Command:
//npm init -y
//npm i express express-handlebars body-parser mongoose bcrypt connect-mongodb-session express-session 

const express = require('express');
const server = express();

const bodyParser = require('body-parser');
server.use(express.json()); 
server.use(express.urlencoded({ extended: true }));

const handlebars = require('express-handlebars');
server.set('view engine', 'hbs');
server.engine('hbs', handlebars.engine({
    extname: 'hbs'
}));

server.use(express.static('public'));

const bcrypt = require('bcrypt');
const saltRounds = 10;

const mongoose = require('mongoose');
const uri = "mongodb://127.0.0.1:27017/GABAY"; //temp local connection
mongoose.connect(uri);

const patientSchema = new mongoose.Schema({
    name: { type: String },
    birthday: {type: Date},
    age: { type: Number },
    reason: {type: String}
  },{ versionKey: false });
  
const patientModel = mongoose.model('patient', patientSchema);

const session = require('express-session');
const mongoStore = require('connect-mongodb-session')(session);

function errorFn(err){
    console.log('Error found. Please trace!');
    console.error(err);
}





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