// routes/locations.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const app = require('../app'); 

// Database Connection
const db = mysql.createConnection({
    host: 'sql207.infinityfree.com', // Your database host
    user: 'if0_37720563',           // Your database username
    password: 'Dhruvin2005',                // Your database password
    database: 'if0_37720563_details' // Your database name
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});

// Get all locations 
router.get('/', (req, res) => {
  const query = 'SELECT DISTINCT location_name FROM locations';
  db.query(query, (error, results) => {
      if (error) {
          console.error("Error fetching locations:", error);
          return res.status(500).json({ message: 'Error fetching locations' });
      }
      res.json(results);
  });
});
// Route for getting vehicles based on location and type
router.get('/vehicles', (req, res) => {
    const location = req.query.location;
    const vehicleType = req.query.vehicleType;

    // Build the SQL query
    const query = `SELECT * FROM vehicles1 WHERE location = '${location}' AND vehicle_type = '${vehicleType}'`;

    db.query(query, (err, results) => { // Use the connected database
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

module.exports = router;