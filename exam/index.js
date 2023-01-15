// Import the modules you need
const express = require('express');
const path = require('path');

//Set up express validator,ES6 destructring
const { check, validationResult } = require('express-validator');

// Create express app
var myApp = express();

// Fetch mongoose into your project
const mongoose = require('mongoose');
// Connect to DB
mongoose.connect('mongodb://127.0.0.1:27017/fruitStore');
// Create a model
const FruitOrder = mongoose.model('FruitOrder', {
    appleAmount: Number,
    bananaAmount: Number,
    totalPricePreTax: Number,
    gst: Number,
    totalPrice: Number,
    customerName: String,
    customerAddress: String,
    customerCity: String,
    customerProvince: String,
    customerEmail: String,
    customerPhone: String
});

// Middlewares and other setup
myApp.use(express.static(__dirname + '/public'));
// Define view engine and views
myApp.set('view engine', 'ejs');

myApp.set('views', path.join(__dirname, 'views'));

// Set up body parser
myApp.use(express.urlencoded({ extended: false }));

// Routes

// Render store.ejs file from the views folder (home page)
myApp.get('/', function (req, res) {
    res.render('store'); // 
});

//Show all orders in one table
myApp.get('/list', function (req, res) {

    FruitOrder.find({}).exec(function (err, fruitOrders) {
        var pageData = {
            fruitOrders: fruitOrders
        }
        res.render('list', pageData);
    });
});

//process view details
myApp.get('/view/:id', function (req, res) {
    var id = req.params.id;

    FruitOrder.findOne({ _id: id }).exec(function (err, fruitOrder) {
        var pageData = {
            appleAmount: fruitOrder.appleAmount,
            bananaAmount: fruitOrder.bananaAmount,
            totalPricePreTax: fruitOrder.totalPricePreTax,
            gst: fruitOrder.gst,
            totalPrice: fruitOrder.totalPrice,
            customerName: fruitOrder.customerName,
            customerAddress: fruitOrder.customerAddress,
            customerCity: fruitOrder.customerCity,
            customerProvince: fruitOrder.customerProvince,
            customerEmail: fruitOrder.customerEmail,
            customerPhone: fruitOrder.customerPhone
        }
        res.render('process', pageData);
    });

});

//Custom validation
function customInputValidation(value, { req }) {

    var appleAmount = req.body.appleAmount;
    var bananaAmount = req.body.bananaAmount;

    if (appleAmount == "" && bananaAmount == "") {
        throw new Error('you did not buy anything!');
    } else if (appleAmount == 0 && bananaAmount == 0) {
        throw new Error('you did not buy anything!');
    } else if ((!(/(^[0-9]\d*$)/.test(appleAmount))) && !(appleAmount == "")) {
        throw new Error('Please enter a positive number value for apple amount only!!');
    } else if ((!(/(^[0-9]\d*$)/.test(bananaAmount))) && !(bananaAmount == "")) {
        throw new Error('Please enter a positive number value for banana amount only!!');
    }
    return true;
}

//process order
myApp.post('/process', [
    check('appleAmount').custom(customInputValidation),
    check('customerName', 'Please enter name!').notEmpty(),
    check('customerAddress', 'Please enter address!').notEmpty(),
    check('customerCity', 'Please enter city!').notEmpty(),
    check('customerProvince', 'Please enter province!').notEmpty(),
    check('customerEmail', 'Please enter an email!').isEmail(),
    check('customerPhone', 'Please enter an phone number!').matches(/^[\d]{3}[\s\-]?[\d]{3}[\s\-]?[\d]{4}$/)
], function (req, res) {
    //fetch data
    var appleAmount = req.body.appleAmount;
    var bananaAmount = req.body.bananaAmount;

    //if user did not enter anything
    appleAmount = appleAmount == "" ? 0 : appleAmount;
    bananaAmount = bananaAmount == "" ? 0 : bananaAmount;

    // fetch data
    var customerName = req.body.customerName;
    var customerAddress = req.body.customerAddress;
    var customerCity = req.body.customerCity;
    var customerProvince = req.body.customerProvince;
    var customerEmail = req.body.customerEmail;
    var customerPhone = req.body.customerPhone;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        var errorData = errors.array();
        console.log(errorData);
        res.render('store', { errors: errorData });
    } else {

        const applePrice = 10.00;
        const bananaPrice = 5.00;

        var appleTotalPrice = appleAmount * applePrice;
        var bananaTotalPrice = bananaPrice * bananaAmount;
        var totalPricePreTax = appleTotalPrice + bananaTotalPrice;
        var taxRate;
        // Decide taxRate value based on which province
        switch (customerProvince) {
            case 'Alberta':
                taxRate = 0.05;
                break;
            case 'British Columbia':
                taxRate = 0.12;
                break;
            case 'Manitoba':
                taxRate = 0.12;
                break;
            case 'New Brunswick':
                taxRate = 0.15;
                break;
            case 'Newfoundland':
                taxRate = 0.15;
                break;
            case 'NorthwestTerritories':
                taxRate = 0.05;
                break;
            case 'Nova Scotia':
                taxRate = 0.15;
                break;
            case 'Nunavut':
                taxRate = 0.05;
                break;
            case 'Ontario':
                taxRate = 0.13;
                break;
            case 'PrinceEdwardIsland':
                taxRate = 0.15;
                break;
            case 'Quebec':
                taxRate = 0.14975;
                break;
            case 'Saskatchewan':
                taxRate = 0.05;
                break;
            case 'Yukon':
                taxRate = 0.11;
                break;
            default:
                taxRate = 0.15;
                break;
        }
        var gst = totalPricePreTax * taxRate;
        var totalPrice = totalPricePreTax + gst;

        // Send data to view
        var pageData = {
            appleAmount: appleAmount,
            bananaAmount: bananaAmount,
            totalPricePreTax: totalPricePreTax,
            gst: gst,
            totalPrice: totalPrice,
            customerName: customerName,
            customerAddress: customerAddress,
            customerCity: customerCity,
            customerProvince: customerProvince,
            customerEmail: customerEmail,
            customerPhone: customerPhone
        }
        // Create an object with the data and the model should be saved
        var myFruitOrder = new FruitOrder(pageData);
        // Save object
        myFruitOrder.save();

        res.render('process', pageData);
    }
});

myApp.listen(8080);
console.log('Open http://localhost:8080 in your browser');
