const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');
const locationsRoute = require('./routes/locations');
const app = express();
const PORT = process.env.PORT || 3000;
const ejs = require('ejs');
require('dotenv').config();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files 
app.use(express.static('public'));


// Database Connection
const db = mysql.createConnection({
    host: 'b3qucopmbb6fgnq8kekp-mysql.services.clever-cloud.com', // Your database host
    user: 'ujjmrpdrjflefsxx',           // Your database username
    password: 'r2ZIdUC8e6kvUmPWSWTC',                // Your database password
    database: 'b3qucopmbb6fgnq8kekp' // Your database name
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Set the views directory (where your .ejs files are)
app.set('views', path.join(__dirname, 'views'));

// Helper function to select table based on role
function getTableByRole(role) {
    if (role === 'customer') return 'customers';
    if (role === 'driver') return 'drivers';
    if (role === 'admin') return 'admins';
    return null;
}

// JWT authentication middleware
function authenticateToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.redirect('/login.html');
    }

    jwt.verify(token, 'secretKey', (err, user) => {
        if (err) {
            return res.redirect('/login.html');
        }
        req.user = user;
        next();
    });
}

app.post('/signup', async (req, res) => {
    const { role, username, email, phone_no, password, security_question, security_answer } = req.body;

    // Use getTableByRole to determine the target table
    const tableName = getTableByRole(role);

    if (!tableName) {
        return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Prepare data for insertion
    const insertData = {
        username,
        email,
        phone_no,
        password,  // Consider hashing the password before insertion for security
        security_question,
        security_answer
    };

    // Insert into the dynamically determined table
    db.query(`INSERT INTO ${tableName} SET ?`, insertData, (error, results) => {
        if (error) {
            console.error("Error inserting data:", error);
            return res.status(500).json({ message: 'Error signing up', error });
        }
        res.status(201).json({ message: `${role.charAt(0).toUpperCase() + role.slice(1)} signed up successfully` });
    });
});

// Login Route

// Login Route
app.post('/login', (req, res) => {
    const { role, username, password } = req.body;
    const tableName = getTableByRole(role);

    if (!tableName) {
        return res.status(400).json({ message: 'Invalid role specified' });
    }

    db.query(`SELECT * FROM ${tableName} WHERE username = ? AND password = ?`, [username, password], (error, results) => {
        if (error || results.length === 0) {
            return res.status(400).json({ message: 'User not found' });
        }

        const user = results[0];

        // Generate a JWT token
        const token = jwt.sign({ userId: user.id, role: role }, 'secretKey', { expiresIn: '1h' });

        // Set a cookie with the token
        res.cookie('token', token, { httpOnly: true, maxAge: 3600000 });

        // Redirect based on user role
        if (role === 'driver') {
            res.redirect('/driver.html');  // Redirect to drivers page for drivers
        } else {
            res.redirect('/index.html');   // Redirect to default page for other roles
        }
    });
});


// Forgot Password Route
app.post('/forgotPassword', (req, res) => {
    const { role, username, security_question, security_answer, new_password } = req.body;
    const tableName = getTableByRole(role);

    if (!tableName) {
        return res.status(400).json({ message: 'Invalid role specified' });
    }

    db.query(`SELECT * FROM ${tableName} WHERE username = ? AND security_question = ?`, [username, security_question], async (error, results) => {
        if (error || results.length === 0) {
            return res.status(400).json({ message: 'User not found or security question mismatch' });
        }

        const user = results[0];
        const isAnswerMatch = await bcrypt.compare(security_answer, user.security_answer);

        if (!isAnswerMatch) {
            return res.status(400).json({ message: 'Invalid security answer' });
        }

        const hashedNewPassword = await bcrypt.hash(new_password, 10);

        db.query(`UPDATE ${tableName} SET password = ? WHERE id = ?`, [hashedNewPassword, user.id], (error) => {
            if (error) {
                return res.status(500).json({ message: 'Error updating password' });
            }
            res.json({ message: 'Password updated successfully' });
        });
    });
});

// Protect /index.html route with JWT authentication
app.get('/index.html', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Use the locations route
app.use('/api/locations', locationsRoute);

module.exports = app; 

// Route to fetch booking requests for drivers
app.get('/api/driver/requests', authenticateToken, (req, res) => {
    const query = `
        SELECT 
            bookings.id AS request_id, 
            customers.username AS customer_name, 
            bookings.pickup_location, 
            bookings.dropoff_location, 
            bookings.car_name AS vehicle_type, 
            bookings.driver_accepted 
        FROM bookings 
        INNER JOIN customers ON bookings.customer_id = customers.id
        WHERE bookings.driver_accepted = "pending";
    `;

    db.query(query, (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Error fetching driver requests.' });
        }
        res.json(results);
    });
});

// Accept a booking request
app.post('/api/driver/accept/:id', authenticateToken, (req, res) => {
    const requestId = req.params.id;
    db.query(`UPDATE bookings SET driver_accepted = 1 WHERE id = ?`, [requestId], (error) => {
        if (error) {
            return res.status(500).json({ message: 'Error accepting request' });
        }
        res.json({ message: 'Request accepted' });
    });
});

// Deny a booking request
app.post('/api/driver/deny/:id', authenticateToken, (req, res) => {
    const requestId = req.params.id;
    db.query(`UPDATE bookings SET driver_accepted = 0 WHERE id = ?`, [requestId], (error) => {
        if (error) {
            return res.status(500).json({ message: 'Error denying request' });
        }
        res.json({ message: 'Request denied' });
    });
});


// Start the server
app.listen(PORT, () => {
    console.log(`App running on http://localhost:${PORT}`);
});


// Route for booking summary
app.post('/booking-summary', authenticateToken, (req, res) => {
    const { carName, imageUrl, startDate, endDate, days, driver, pickupLocation, dropoffLocation } = req.body;

    // Data Type Conversion (if necessary)
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);

    db.query(`SELECT * FROM vehicles1 WHERE LOWER(car_name) = LOWER(?)`, [carName], (err, results) => {
        if (err) {
            console.error("Error fetching car details:", err);
            return res.status(500).json({ message: 'Error fetching car details', error: err.sqlMessage });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Car not found' });
        }

        const car = results[0];
        const transmission = car.transmission;
        const fuelType = car.fuelType;
        const seats = car.seats;

        // Fetch customer details from the database 
        db.query('SELECT username, email FROM customers WHERE id = ?', [req.user.userId], (err, customerResults) => {
            if (err) {
                console.error("Error fetching customer details:", err);
                return res.status(500).json({ message: 'Error fetching customer details', error: err.sqlMessage });
            }

            if (customerResults.length === 0) {
                return res.status(404).json({ message: 'Customer not found' });
            }

            const customer = customerResults[0]; 

            // Calculate the total price (move inside the inner callback)
            const pricePerHour = car.price_per_hour;
            const pricePerDay = pricePerHour * 24;
            const totalCost = pricePerDay * days;
            const driverCost = (driver === "yes") ? pricePerDay * 0.15 * days : 0;
            const gst = totalCost * 0.18;
            const grandTotal = totalCost + gst + driverCost;

            const sql = "INSERT INTO bookings (pickup_location, dropoff_location, vehicle_id, start_date, end_date, driver_status, driver_accepted, driver_cost, total_cost, days, customer_id, car_name, image_url, total_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"; 
            // The  'vehicleId' should be fetched from the previous query and then used in the insert query.
            db.query(sql, [pickupLocation, dropoffLocation, car.id, startDateTime, endDateTime, 'pending', 0, driverCost, totalCost, days, req.user.userId, carName, imageUrl, grandTotal], (err, results) => { 
                if (err) {
                    console.error("Error inserting booking:", err);
                    return res.status(500).json({ message: 'Error booking vehicle', error: err.sqlMessage });
                }

                // Pass data to summary.ejs
                res.render('summary', {
                    carName: carName,
                    imageUrl: imageUrl,
                    days: days,
                    driver: driver === 'yes' ? 'Yes' : 'No',
                    startDate: startDate,
                    endDate: endDate,
                    total_price: grandTotal,
                    transmission: transmission,
                    seats: seats,
                    fuelType: fuelType,
                    customerName: customer.username, // Pass customerName
                    customerEmail: customer.email, // Pass customerEmail
                    totalCost: totalCost, // Pass totalCost
                    driverCost: driverCost, // Pass driverCost
                    gst: gst, // Pass gst
                    pricePerDay: pricePerDay,
                });
            });
        });
    });
});