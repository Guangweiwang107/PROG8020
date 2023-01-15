//Get express lib
const express = require('express');
//Get session lib
const session = require('express-session');
//Get fileupload lib
const fileupload = require('express-fileupload');
//Get express-validator, destructuring an object
const { check, validationResult } = require('express-validator');
//Create express application
var myApp = express();
//Express path
const path = require('path');
//Get mongoose library
const mongoose = require('mongoose');
//Connect to the mongoDB
mongoose.connect('mongodb://127.0.0.1:27017/recyclingRequests');
//Create models
const RecyclingRequest = mongoose.model('RecyclingRequest', {
    inputName: String,
    inputEmailOrPhone: String,
    imageName: String,
    inputMessage: String
});

const AdminUser = mongoose.model('AdminUser', {
    username: String,
    password: String
});

//Set up session
myApp.use(session({
    secret: 'conestoga2023',
    resave: false,
    saveUninitialized: true
}));

//Static resources middlewares
myApp.use(express.static(__dirname + '/public'));
//View engine is EJS
myApp.set('view engine', 'ejs');
//Views routes
myApp.set('views', path.join(__dirname, 'views'));

//Set up body parser
myApp.use(express.urlencoded({ extended: false }));
//File upload app
myApp.use(fileupload());

//New request route
myApp.get('/', function (req, res) {
    res.render('form');
});


//Login route
myApp.get('/login', function (req, res) {
    res.render('login')
});


//Logout route
myApp.get('/logout', function (req, res) {
    req.session.username = '';
    req.session.loggedIn = false;
    res.redirect('/login');
});


//Show list of requests
myApp.get('/dashboard', function (req, res) {

    if (req.session.loggedIn) {
        RecyclingRequest.find({}).exec(function (err, recyclingRequests) {
            var pageData = {
                recyclingRequests: recyclingRequests
            }
            res.render('dashboard', pageData);
        });
    }
    else {
        //Redirect to login page
        res.redirect('/login');
    }
});


//Display details of a request
myApp.get('/view/:id', function (req, res) {
    if (req.session.loggedIn) {
        //Get data from mongoDB and render it to the view
        RecyclingRequest.findOne({ _id: req.params.id }).exec(function (err, recyclingRequest) {
            var pageData = {
                inputName: recyclingRequest.inputName,
                inputEmailOrPhone: recyclingRequest.inputEmailOrPhone,
                imageName: recyclingRequest.imageName,
                inputMessage: recyclingRequest.inputMessage
            }
            // Render view
            res.render('view', pageData);
        });
    }
    else {
        res.redirect('/login');
    }
});


//Request of edit
myApp.get('/edit/:id', function (req, res) {
    if (req.session.loggedIn) {
        //Get data 
        RecyclingRequest.findOne({ _id: req.params.id }).exec(function (err, recyclingRequest) {
            var pageData = {
                inputName: recyclingRequest.inputName,
                inputEmailOrPhone: recyclingRequest.inputEmailOrPhone,
                imageName: recyclingRequest.imageName,
                inputMessage: recyclingRequest.inputMessage,
                id: req.params.id
            }
            //Render data to the edit view
            res.render('edit', pageData);
        });
    }
    else {
        res.redirect('/login');
    }
});


//Request of edit 
myApp.post('/editprocess', function (req, res) {
    if (req.session.loggedIn) {
        //Get data from request
        var id = req.body.id;
        var inputName = req.body.inputName;
        var inputEmailOrPhone = req.body.inputEmailOrPhone;
        var inputMessage = req.body.message;
        //If image didn't update
        if (!(req.files == null)) {
            //Get image
            var image = req.files.formFile;
            var imageName = req.files.formFile.name;
            //Path to store the image
            var imagePath = 'public/uploads/' + imageName;
            //Store image permamently
            image.mv(imagePath);
        }
        //Request of update
        RecyclingRequest.findOne({ _id: id }).exec(function (err, recyclingRequest) {
            recyclingRequest.inputName = inputName;
            recyclingRequest.inputEmailOrPhone = inputEmailOrPhone;
            if (!(req.files == null)) {
                recyclingRequest.imageName = imageName;
            }
            recyclingRequest.inputMessage = inputMessage;
            recyclingRequest.save();
        });
        var pageData = {
            message: 'Recycling request updated successfully'
        }
        res.render('success', pageData);

    }
    else {
        res.redirect('/login');
    }
});


//Request of delete 
myApp.get('/delete/:id', function (req, res) {
    if (req.session.loggedIn) {
        RecyclingRequest.findByIdAndDelete({ _id: req.params.id }).exec(function (err, recyclingRequest) {
            var message = 'Sorry, recycling request not found';
            if (recyclingRequest) {
                message = 'Recycling request deleted successfully';
            }
            var pageData = {
                message: message
            }
            res.render('success', pageData);
        });
    }
    else {
        res.redirect('/login');
    }
});


//New request
myApp.post('/process', [
    check('inputName', 'Please enter name').notEmpty(),
    check('inputEmailOrPhone', 'Please enter an email or phone').notEmpty()
], function (req, res) {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.render('form', { er: errors.array() });
    }
    else {
        //Get data from request
        var inputName = req.body.inputName;
        var inputEmailOrPhone = req.body.inputEmailOrPhone;
        var inputMessage = req.body.message;
        // Get image
        var image = req.files.formFile;
        // Get image name
        var imageName = req.files.formFile.name;
        // Path to store image
        var imagePath = 'public/uploads/' + imageName;
        // Store the image permamently
        image.mv(imagePath);
        // Data will be sent to view
        var pageData = {
            inputName: inputName,
            inputEmailOrPhone: inputEmailOrPhone,
            imageName: imageName,
            inputMessage: inputMessage
        }
        //Create RecyclingRequest object using the data above
        var newRecyclingRequest = new RecyclingRequest(pageData);
        //Save
        newRecyclingRequest.save();
        //Render data to view 
        res.render('success', { message: 'Your request has been successfully submitted' });
    }
});


//Create a user
myApp.get('/createAdmin', function (req, res) {
    var adminData = {
        username: 'admin',
        password: 'admin'
    }
    var newAdmin = new AdminUser(adminData);
    newAdmin.save();
    res.render('success', { createMessage: "Professor, you have successfully registered, your username is:  <strong style='color:red';>admin</strong>, your password is: <strong style='color:red';>admin</strong>" });
});


//Login route
myApp.post('/login', [
    check('inputUsername', 'Please enter username').notEmpty(),
    check('inputPassword', 'Please enter password').notEmpty()
], function (req, res) {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.render('login', { er: errors.array() });
    }
    else {
        //Get user info
        var username = req.body.inputUsername;
        var password = req.body.inputPassword;

        // Get document from mongoDB 
        AdminUser.findOne({ username: username, password: password }).exec(function (err, adminuser) {
            //If there is the very user
            if (adminuser) {
                //Save it to the session
                req.session.username = adminuser.username;
                req.session.loggedIn = true;
                res.redirect('/dashboard');
            }
            else {
                var errors = [{
                    msg: 'Username or password not correct'
                }];
                res.render('login', { er: errors });
            }

        });
    }
});


myApp.listen(8080);
console.log('Open http://localhost:8080 in your browser');
