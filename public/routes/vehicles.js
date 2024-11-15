// routes/vehicles.js
const express = require('express');
const router = express.Router();

// Handle the GET request for /api/vehicles
router.get('/', (req, res) => {
  const { location, vehicleType } = req.query; 
  const query = `
    SELECT car_name, image_url, transmission, fuel_type, seats, price_per_hour, rating, trips 
    FROM vehicles1 
    WHERE Location = ? AND vehicle_type = ?
  `;
  req.db.query(query, [location, vehicleType], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results); 
  });
});

module.exports = router;