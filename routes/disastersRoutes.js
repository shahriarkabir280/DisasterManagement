const express = require('express');
const path = require('path');
const db = require('../config/db'); // Import MySQL connection
const router = express.Router();
const moment = require('moment');

// Serve the Disasters HTML page
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views', 'disasters.html'));
});


// Fetch all disaster data without filters
router.get('/api', (req, res) => {
  const query = 'SELECT * FROM Disaster LIMIT 50'; // Fetch all disasters with limit of 50
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error fetching data from the database');
    }
    res.json(results); // Send the fetched data as JSON to the frontend
  });
});


// // Fetch disaster data with filters
// router.get('/api/filter', (req, res) => {
//   const disasterType = req.query.disasterType || 'all';
//   const location = req.query.location || '';
//   const date = req.query.date || '';

//   // Build the query based on filter parameters
//   let query = 'SELECT * FROM Disaster WHERE 1';
//   const params = [];

//   if (disasterType !== 'all') {
//     query += ' AND DisasterType = ?';
//     params.push(disasterType);
//   }
//   if (location) {
//     query += ' AND Location LIKE ?';
//     params.push(`%${location}%`);
//   }
//   if (date) {
//     query += ' AND DateOccurred = ?';
//     params.push(date);
//   }

//   query += ' LIMIT 50'; // Limit to 50 rows for performance

//   db.query(query, params, (err, results) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).send('Error fetching data from the database');
//     }
//     res.json(results); // Send the filtered disaster data
//   });
// });



router.get('/api/filter', (req, res) => {
  const disasterType = req.query.disasterType || 'all';
  const location = req.query.location || '';  // Empty string as default
  const date = req.query.date || '';  // Empty string as default

  // Build the query based on filter parameters
  let query = 'SELECT * FROM Disaster WHERE 1';
  const params = [];

  if (disasterType !== 'all') {
    query += ' AND DisasterType = ?';
    params.push(disasterType);
  }
  if (location) {
    query += ' AND Location LIKE ?';
    params.push(`%${location}%`);
  }
  if (date) {
    query += ' AND DateOccurred = ?';
    params.push(date);
  }

  query += ' LIMIT 50'; // Limit to 50 rows for performance

  db.query(query, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error fetching data from the database');
      
    }
    res.json(results); // Send the disaster data to the frontend
  });
});


// API for fetching disaster statistics
router.get('/api/statistics', async (req, res) => {
  try {
    // Query for the total number of disasters
    const countQuery = 'SELECT COUNT(*) AS disasterCount FROM Disaster';
    const [countResults] = await db.promise().query(countQuery);
    console.log(countQuery);
    // Query for the total number of unique affected areas (locations)
    const uniqueLocationQuery = 'SELECT COUNT(DISTINCT Location) AS affectedAreaCount  FROM Disaster';
    const [locationResults] = await db.promise().query(uniqueLocationQuery);

    // Query for the most recent disaster
    const recentDisasterQuery = 'SELECT DisasterType, Location, DateOccurred FROM Disaster ORDER BY DateOccurred DESC LIMIT 1';
    const [recentResults] = await db.promise().query(recentDisasterQuery);

    // Extract values safely
    const disasterCount = countResults[0]?.disasterCount || 0;
    const affectedAreaCount = locationResults[0]?.affectedAreaCount || 0;
    const recentDisaster = recentResults.length ? recentResults[0] : null;
    
    if (recentDisaster) {
      recentDisaster.DateOccurred = moment(recentDisaster.DateOccurred).format('DD MMM, YYYY');
    }

    // Return JSON response in correct format
    res.json({
      disasterCount,
      affectedAreaCount,
      recentDisaster: recentDisaster
        ? {
            DisasterType: recentDisaster.DisasterType,
            Location: recentDisaster.Location,
            DateOccurred: recentDisaster.DateOccurred,
          }
        : null, // Instead of 'N/A', return `null` for better frontend handling
    });

  } catch (err) {
    console.error('Error fetching statistics:', err);
    res.status(500).json({ error: 'Error fetching statistics from the database' });
  }
});


  console.log('It is working');
  
module.exports = router;
