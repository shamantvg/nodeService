const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const app = express();
const mysql = require('mysql');
const md5 = require('md5');
const nodemailer = require('nodemailer');
var fs = require('fs');

// Body Parser Middleware
app.use(bodyParser.json());

//CORS Middleware
app.use(function(req, res, next) {
    //Enabling CORS 
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, contentType,Content-Type, Accept, Authorization");
    next();
});

//Setting up server
var server = app.listen(process.env.PORT || 8080, function() {
    var port = server.address().port;
    console.log("App now running on port", port);
});

//Initiallising conn string

const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'assetmanage',
    multipleStatements: true
});

//connect to database
conn.connect((err) => {
    if (err) throw err;
    console.log('Mysql Connected...');
});


function verifyToken(req, res, next) {
    if (!req.headers.authorization) {
        return res.status(401).send('Unauthorized request.');
    }
    let token = req.headers.authorization.split(' ')[1];
    if (token === 'null') {
        return res.status(401).send('Unauthorized request.');
    }
    let payload = jwt.verify(token, 'ceaedca7f78911ed3f36118a1b958cc5');
    //console.log("log--->" + payload);
    if (!payload) {
        return res.status(401).send('Unauthorized request.');
    }
    req.userId = payload.subject;
    next();

}


//function to get present time
function getTimeNow() {
    const start = Date.now();
    let timeP = Math.floor(start / 1000);
    return timeP;
}

function getHash() {
    const start = Date.now();
    let message = md5('hash-shamant') + Math.floor(start / 1000);
    return md5(message);
}

function mailingTo(fromM, ToM, Sub, conT) {

}

//testing api
app.get('/api/test', (req, res) => {

    try {
        var data = fs.readFileSync('mailtemp.html', 'utf8');
        // declare vars,
        let fromMail = 'rahulvg12345@gmail.com';
        let toMail = 'shamantvg@gmail.com';
        let subject = 'Reset Password';
        //let html = data;

        var tokenNew = "SG000123";

        let html = data.replace(/SG001/gi, tokenNew);


        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: fromMail,
                pass: 'rahu0088'
            }
        });

        // email options
        let mailOptions = {
            from: fromMail,
            to: toMail,
            subject: subject,
            html: html
        };


        //send email
        transporter.sendMail(mailOptions, (error, response) => {
            if (error) {
                console.log(error);
                res.status(500).send({ error });
            }
            console.log(response);
            res.status(200).send({ "message": "success" });
        });
    } catch (e) {
        console.log('Error:', e.stack);
    }
});


//tesing api
app.get('/api/user', (req, res) => {
    let sql = "SELECT * FROM persons";
    let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        res.status(200).send(results);
        //res.send(JSON.stringify({ "status": 200, "error": null, "response": results }));
    });
});

//get all employee details
app.get('/employee', verifyToken, (req, res) => {
    let sql = "select E.id,E.firstname,E.lastname from employee E order by firstname";
    let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        res.status(200).send(results);
        //res.send(JSON.stringify({ "status": 200, "error": null, "response": results }));
    });
});


// get all asset details
app.get('/assets', verifyToken, (req, res) => {
    let sql = "select * from assets";
    let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        res.status(200).send(results);
        //res.send(JSON.stringify({ "status": 200, "error": null, "response": results }));
    });
});


//delete asset api
app.delete('/assets/:id', verifyToken, (req, res) => {
    let sql = "DELETE FROM assets WHERE id =" + req.params.id;
    let sql2 = "DELETE FROM employeeasset WHERE asset_id =" + req.params.id;

    let query = conn.query(sql + ';' + sql2, [1, 2], function(err, results) {
        if (err) throw err;

        // `results` is an array with one element for every statement in the query:
        //console.log(results[0]); // [{1: 1}]
        //console.log(results[1]); // [{2: 2}]
        res.status(200).send(JSON.stringify({ "status": "200" }));
    });
});



// Get asset details based on emp id
app.get('/employeeasset/:id', verifyToken, (req, res) => {
    let sql = "SELECT E.* FROM employeeasset EA, employee E WHERE E.id = EA.emp_id AND EA.asset_id = " + req.params.id;
    let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        res.status(200).send(results);
        //res.send(JSON.stringify({ "status": 200, "error": null, "response": results }));
    });
});


//assign asset to employee
app.post('/employeeasset', verifyToken, (req, res) => {

    var assetId = req.body.asset_id;
    var empId = req.body.employee_id;

    let sql = "INSERT INTO employeeasset (asset_id,emp_id,date) VALUES ('" + assetId + "','" + empId + "',UNIX_TIMESTAMP()) ON DUPLICATE KEY UPDATE emp_id=VALUES(emp_id),date=VALUES(date)";
    let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        //res.status(200).send(results);
        res.status(200).send(JSON.stringify({ "status": "200" }));
        //res.send(JSON.stringify({ "status": 200, "error": null, "response": results }));
    });
});




//add asset api
app.post('/assets', verifyToken, (req, res) => {

    var serial_number = req.body.system_serial_number;
    var type = req.body.asset_type;
    var OEM = req.body.OEM;
    var model = req.body.model;
    var procure_date = req.body.procure_date;
    var warranty_startDate = req.body.warranty_startDate;
    var warranty_end_date = req.body.warrenty_endDate;
    var amc_startDate = req.body.AMC_startDate;
    var amc_endDate = req.body.AMC_endDate;
    var os_image = req.body.os_image;
    var is_customer_compliant = req.body.is_AMAT_compliant;
    var customer_dept = req.body.GIS_GDC;


    let sql = "INSERT INTO assets (serial_number, type, OEM, model, procure_date, warranty_start_date, warranty_end_date, amc_startdate, amc_endate, os_image, is_customer_compliant, customer_dept) VALUES ('" + serial_number + "', '" + type + "', '" + OEM + "', '" + model + "', '" + procure_date + "', '" + warranty_startDate + "', '" + warranty_end_date + "', '" + amc_startDate + "', '" + amc_endDate + "', '" + os_image + "','" + is_customer_compliant + "' , '" + customer_dept + "')";
    let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        res.status(200).send(JSON.stringify({ "status": "200" }));
        //res.status(200).send(results);
        //res.send(JSON.stringify({ "status": 200, "error": null, "response": results }));
    });
});



//modify asset
app.put('/assets', verifyToken, (req, res) => {

    var id = req.body.id;
    //var serial_number = req.body.system_serial_number;
    var type = req.body.asset_type_edit;
    var OEM = req.body.OEM_edit;
    var model = req.body.model_edit;
    var procure_date = req.body.procure_date_edit;
    var warranty_startDate = req.body.warranty_startDate_edit;
    var warranty_end_date = req.body.warrenty_endDate_edit;
    var amc_startDate = req.body.AMC_startDate_edit;
    var amc_endDate = req.body.AMC_endDate_edit;
    var os_image = req.body.os_image_edit;
    var is_customer_compliant = req.body.is_AMAT_compliant_edit;
    var customer_dept = req.body.GIS_GDC_edit;

    let sql = "Update assets SET type = '" + type + "', OEM= '" + OEM + "', model= '" + model + "', procure_date= '" + procure_date + "', warranty_start_date= '" + warranty_startDate + "', warranty_end_date= '" + warranty_end_date + "', amc_startdate= '" + amc_startDate + "', amc_endate= '" + amc_endDate + "', os_image= '" + os_image + "', is_customer_compliant= '" + is_customer_compliant + "', customer_dept= '" + customer_dept + "' where id = '" + id + "'";
    let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        //res.status(200).send(results);
        res.status(200).send(JSON.stringify({ "status": "200" }));
        //res.send(JSON.stringify({ "status": 200, "error": null, "response": results }));
    });
});

//asset export details
app.get('/assetsexport', verifyToken, (req, res) => {
    let sql = "SELECT ROW_NUMBER() OVER (ORDER BY A.id) AS RowNum,A.serial_number SerialNumber,A.`type` Type,A.OEM,A.model,DATE_FORMAT(A.procure_date, '%m/%d/%Y %h:%i %p') AS ProcureDate,DATE_FORMAT(A.warranty_start_date, '%m/%d/%Y %h:%i %p') AS WarrantyStartDate, DATE_FORMAT(A.warranty_end_date, '%m/%d/%Y %h:%i %p') AS warrantyEndDate,DATE_FORMAT(A.amc_startdate, '%m/%d/%Y %h:%i %p') AS amcStartDate,DATE_FORMAT(A.amc_endate, '%m/%d/%Y %h:%i %p') AS amcEndDate,A.os_image OSimage, CASE WHEN is_customer_compliant = 'Y' THEN 'Yes'ELSE 'No' END AS IsCustomerCompliant ,A.customer_dept customerDept FROM assets A;";
    let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        res.status(200).send(results);
        //res.send(JSON.stringify({ "status": 200, "error": null, "response": results }));
    });
});

//Employee-asset export details
app.get('/empyolee/assetsexport', verifyToken, (req, res) => {
    let sql = "SELECT ROW_NUMBER() OVER (ORDER BY A.id) AS RowNum,E.firstname,E.lastname,E.email,E.contactNumber, A.serial_number SerialNumber,A.`type` Type,A.OEM,A.model,FROM_UNIXTIME(EA.date,'%m/%d/%Y %h:%i %p') AS AssignedOn FROM assets A,employeeasset EA,employee E WHERE E.id = EA.emp_id AND EA.asset_id = A.id";
    let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        res.status(200).send(results);
        //res.send(JSON.stringify({ "status": 200, "error": null, "response": results }));
    });
});

//employeeAuth
app.post('/employeeAuth', (req, res) => {

    var adminId = req.body.adminId;
    var pswd = req.body.pswd;

    let sql = "SELECT E.id,E.loginAccess,E.adminAccess FROM employee E WHERE E.adminId = '" + adminId + "' AND E.password = '" + pswd + "' LIMIT 1";
    let query = conn.query(sql, (err, results) => {
        if (err) {
            //throw err;
            console.log(err);
        } else {
            //console.log("length--->" + results.length);
            if (results.length > 0) {
                //console.log("res-->" + results[0].id);
                let payload = { subject: results[0].id };
                let loginAccess = results[0].loginAccess;
                let adminAccess = results[0].adminAccess;
                let token = jwt.sign(payload, 'ceaedca7f78911ed3f36118a1b958cc5') //shamantapi
                res.status(200).send({ token, loginAccess, adminAccess });
            } else {
                res.status(401).send("Invalid request");
            }

        }
        //res.status(200).send(results);

        //res.send(JSON.stringify({ "status": 200, "error": null, "response": results }));
    });
});

//assign asset to employee
app.post('/employee', verifyToken, (req, res) => {

    var i;
    var obj = req.body.data;
    var columnCouter = 0;


    if (obj.length === 0) {
        res.status(501).send(JSON.stringify({ "message": "Please provide employee details" }));
        return false;
    }

    let sql = "INSERT INTO employee (firstname,lastname,email,contactNumber,adminId,password,loginAccess,adminAccess) VALUES ";

    // if (result[0].loginAccess === "1" || result[0].loginAccess === 1) {
    // }
    for (i = 0; i < obj.length; i++) {


        var firstname = obj[i].firstname;
        var lastname = obj[i].lastname;
        var email = obj[i].emailId;
        var contactNumber = obj[i].contactNumber;
        var AdminId = obj[i].AdminId;
        var password = obj[i].password;
        var LoginAccess = obj[i].LoginAccess;
        var AdminAccess = obj[i].AdminAccess;

        if (firstname === undefined || lastname === undefined || email === undefined || contactNumber === undefined || AdminId === undefined || password === undefined || LoginAccess === undefined || AdminAccess === undefined) {
            columnCouter++;
        }

        sql += "('" + firstname + "','" + lastname + "','" + email + "','" + contactNumber + "','" + AdminId + "','" + password + "','" + LoginAccess + "','" + AdminAccess + "'),";
    }
    sql = sql.replace(/,+$/, '');

    if (columnCouter > 0) {
        res.status(501).send(JSON.stringify({ "message": "Invalid employee details.Please verify" }));
        return false;
    }

    let query = conn.query(sql, (err, results) => {
        if (err) throw err;
        //res.status(200).send(results);
        res.status(200).send(JSON.stringify({ "status": "200" }));
        //res.send(JSON.stringify({ "status": 200, "error": null, "response": results }));
    });
});

//check seesion token
app.get('/CheckSessionToken', verifyToken, (req, res) => {

    res.status(200).send(JSON.stringify({ "status": "200" }));
});

//employee forgot password
app.post('/forgotPassword', (req, res) => {

    var adminId = req.body.adminId;

    let sql = "SELECT E.id,E.loginAccess,E.adminAccess FROM employee E WHERE E.adminId = '" + adminId + "' LIMIT 1";
    let query = conn.query(sql, (err, results) => {
        if (err) {
            //throw err;
            console.log(err);
        } else {
            //console.log("length--->" + results.length);
            if (results.length > 0) {
                let id = results[0].id;
                // let loginAccess = results[0].loginAccess;
                // let adminAccess = results[0].adminAccess;
                let resetToken = getHash();
                let expiryTime = getTimeNow() + (60 * 60); // one hour expiry time

                let sql_update = "Update employee SET resetToken = '" + resetToken + "', resetExpiry= '" + expiryTime + "' where id = '" + id + "'";
                let query = conn.query(sql_update, (err_upt, results_upt) => {
                    if (err_upt) {
                        throw err_upt;
                    } else {
                        res.status(200).send({ resetToken });
                        // try {
                        //     var data = fs.readFileSync('mailtemp.html', 'utf8');
                        //     // declare vars,
                        //     let fromMail = 'fromemail ID';
                        //     let toMail = 'toemailId';
                        //     let subject = 'Reset Password';
                        //     //let html = data;

                        //     let html = data.replace(/SG001/gi, resetToken);


                        //     const transporter = nodemailer.createTransport({
                        //         service: 'gmail',
                        //         auth: {
                        //             user: fromMail,
                        //             pass: 'yourpassword'
                        //         }
                        //     });

                        //     // email options
                        //     let mailOptions = {
                        //         from: fromMail,
                        //         to: toMail,
                        //         subject: subject,
                        //         html: html
                        //     };


                        //     //send email
                        //     transporter.sendMail(mailOptions, (error, response) => {
                        //         if (error) {
                        //             console.log(error);
                        //             res.status(500).send({ error });
                        //         }
                        //         console.log(response);
                        //         res.status(200).send({ resetToken });
                        //     });
                        // } catch (e) {
                        //     console.log('Error:', e.stack);
                        // }
                    }


                });

            } else {
                let message = "Please enter valid Admin Id";
                res.status(401).send({ message });
            }

        }
        //res.status(200).send(results);

        //res.send(JSON.stringify({ "status": 200, "error": null, "response": results }));
    });
});

app.get('/getResetUser/:adminToken', (req, res) => {

    let timenow = getTimeNow(); // one hour expiry time

    let sql = "SELECT E.firstname from employee E WHERE E.resetToken = '" + req.params.adminToken + "' and E.resetExpiry > '" + timenow + "' ";
    let query = conn.query(sql, (err, results) => {
        if (err) {
            //throw err;
            console.log(err);
        } else {
            //console.log("length--->" + results.length);
            if (results.length > 0) {
                let firstname = results[0].firstname;
                res.status(200).send({ firstname });
            } else {
                let message = "Please enter valid details";
                res.status(401).send({ message });
            }

        }
    });
});

//employee reset Password
app.post('/resetPassword', (req, res) => {

    var pswd = req.body.pswd;
    var htoken = req.body.htoken;

    let timenow = getTimeNow(); // one hour expiry time

    let sql = "SELECT E.firstname from employee E WHERE E.resetToken = '" + htoken + "' and E.resetExpiry > '" + timenow + "' ";
    let query = conn.query(sql, (err, results) => {
        if (err) {
            //throw err;
            console.log(err);
        } else {
            //console.log("length--->" + results.length);
            if (results.length > 0) {
                let sql_update = "Update employee SET resetToken = '', resetExpiry= '',password='" + pswd + "' where resetToken = '" + htoken + "'";
                let query_update = conn.query(sql_update, (err_update, result) => {
                    if (err_update) throw err_update;
                    //console.log(err);
                    //if (result.affectedRows > 0) {
                    res.status(200).send({ 'success': '200' });
                    //}

                });
            } else {
                let message = "Sorry, Your session has been expired !!!";
                res.status(401).send({ message });
            }

        }
    });

});