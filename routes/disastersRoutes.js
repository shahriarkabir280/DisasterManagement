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


router.get('/api/search', (req, res) => {
  const searchQuery = req.query.query || '';  // Default empty string

  // Build the query to search in multiple columns (case-insensitive)
  let query = `
    SELECT * FROM Disaster 
    WHERE LOWER(DisasterType) LIKE LOWER(?) 
    OR LOWER(Location) LIKE LOWER(?) 
    OR LOWER(Description) LIKE LOWER(?) 
    OR LOWER(SeverityLevel) LIKE LOWER(?)
    LIMIT 50
  `;
  
  const wildcardSearch = `%${searchQuery}%`;
  const params = [wildcardSearch, wildcardSearch, wildcardSearch, wildcardSearch];

  db.query(query, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error fetching data from the database');
    }
    res.json(results); // Send data back to frontend
  });
});



// API for fetching disaster statistics
router.get('/api/statistics', async (req, res) => {
  try {
    // Query for the total number of disasters
    const countQuery = 'SELECT COUNT(*) AS disasterCount FROM Disaster';
    const [countResults] = await db.promise().query(countQuery);
   
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



// Add a new disaster to the database
router.post('/api/add', (req, res) => {
  
  console.log("Received request body:", req.body); // Debugging

  if (!req.body) {
    return res.status(400).json({ error: 'Request body is missing' });
  }

  let { DisasterType, Location, DateOccurred, SeverityLevel, Description } = req.body;
  console.log(DisasterType+" "+Location+" "+DateOccurred+" "+SeverityLevel+" "+Description);

  if (!DisasterType || !Location || !DateOccurred || !SeverityLevel || !Description) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Ensure DateOccurred is in YYYY-MM-DD format
  try {
    const formattedDate = new Date(DateOccurred).toISOString().split('T')[0];

    const query = `
      INSERT INTO Disaster (DisasterType, Location, DateOccurred, SeverityLevel, Description)
      VALUES (?, ?, ?, ?, ?)
    `;

    const values = [DisasterType, Location, formattedDate, SeverityLevel, Description];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Error inserting data:', err);
        return res.status(500).json({ error: 'Failed to insert disaster data' });
      }
      res.json({ message: 'Disaster added successfully', id: result.insertId });
    });
  } catch (error) {
    console.error('Error processing date:', error);
    res.status(400).json({ error: 'Invalid date format' });
  }
});



























  console.log('It is working');
  
module.exports = router;
