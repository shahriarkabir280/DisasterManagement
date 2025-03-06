const express = require('express');
const path = require('path');
const db = require('../config/db'); // Import MySQL connection
const router = express.Router();
const moment = require('moment');


// Serve the Victims HTML page
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views', 'rescueteams.html'));
});

// Fetch all rescue teams (limit 50 for efficiency)
router.get('/api', (req, res) => {
  const query = `
    SELECT rt.TeamID, 
           rt.TeamName, 
           rt.TeamType, 
           rt.ContactNumber, 
           CONCAT(l.City, ', ', l.State, ', ', l.Country) AS AssignedArea 
    FROM RescueTeam rt
    JOIN Location l ON rt.LocationID = l.LocationID
    LIMIT 50;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error fetching rescue teams');
    }
    res.json(results);
  });
});

// Search for rescue teams based on name, specialization, or location
router.get('/api/search', (req, res) => {
  const searchQuery = req.query.query || '';
  const wildcardSearch = `%${searchQuery}%`;

  const query = `
    SELECT rt.TeamID, 
           rt.TeamName, 
           rt.TeamType, 
           rt.ContactNumber, 
           CONCAT(l.City, ', ', l.State, ', ', l.Country) AS AssignedArea 
    FROM RescueTeam rt
    JOIN Location l ON rt.LocationID = l.LocationID
    WHERE LOWER(rt.TeamName) LIKE LOWER(?)
       OR LOWER(rt.TeamType) LIKE LOWER(?)
       OR LOWER(CONCAT(l.City, ', ', l.State, ', ', l.Country)) LIKE LOWER(?)
    LIMIT 50;
  `;

  db.query(query, [wildcardSearch, wildcardSearch, wildcardSearch], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error searching rescue teams');
    }
    res.json(results);
  });
});


// Add a new rescue team
router.post('/api/add', (req, res) => {
  if (!req.body) {
      return res.status(400).json({ error: 'Request body is missing' });
  }

  let { teamName, teamType, contactNumber, city, state, country } = req.body;

  console.log(`Received data: ${teamName}, ${teamType}, ${contactNumber}, ${city}, ${state}, ${country}`);

  if (!teamName || !teamType || !contactNumber || !city || !state || !country) {
      return res.status(400).json({ error: 'All fields are required' });
  }

  // Check if the location already exists
  const locationQuery = `SELECT LocationID FROM Location WHERE City = ? AND State = ? AND Country = ?`;
  const locationValues = [city, state, country];

  db.query(locationQuery, locationValues, (err, locationResult) => {
      if (err) {
          console.error('Error checking location:', err);
          return res.status(500).json({ error: 'Failed to check location' });
      }

      if (locationResult.length > 0) {
          // Location exists, use the existing LocationID
          const locationID = locationResult[0].LocationID;
          insertRescueTeam(locationID);
      } else {
          // Insert new location
          const insertLocationQuery = `INSERT INTO Location (City, State, Country) VALUES (?, ?, ?)`;

          db.query(insertLocationQuery, locationValues, (err, result) => {
              if (err) {
                  console.error('Error inserting location:', err);
                  return res.status(500).json({ error: 'Failed to insert location' });
              }

              const newLocationID = result.insertId;
              insertRescueTeam(newLocationID);
          });
      }
  });

  // Function to insert the rescue team using the obtained LocationID
  function insertRescueTeam(locationID) {
      const insertRescueQuery = `
          INSERT INTO RescueTeam (TeamName, TeamType, ContactNumber, LocationID)
          VALUES (?, ?, ?, ?)`;

      const rescueValues = [teamName, teamType, contactNumber, locationID];

      db.query(insertRescueQuery, rescueValues, (err, result) => {
          if (err) {
              console.error('Error inserting rescue team:', err);
              return res.status(500).json({ error: 'Failed to insert rescue team data' });
          }
          res.json({ message: 'Rescue team added successfully', id: result.insertId });
      });
  }
});


router.get('/api/:id', (req, res) => {
  const teamId = req.params.id;

  const query = `
    SELECT r.TeamID, r.TeamName, r.TeamType, r.ContactNumber, 
           l.City, l.State, l.Country 
    FROM RescueTeam r
    JOIN Location l ON r.LocationID = l.LocationID
    WHERE r.TeamID = ?;
  `;

  db.query(query, [teamId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error fetching rescue team data' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Rescue Team not found' });
    }
    res.json(results[0]);
  });
});


router.put('/api/update/:id', (req, res) => {
  const teamId = req.params.id;
  const { TeamName, TeamType, ContactNumber, City, State, Country } = req.body;

  if (!TeamName || !TeamType || !ContactNumber || !City || !State || !Country) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Update Location Table First
  const updateLocationQuery = `
    UPDATE Location 
    SET City = ?, State = ?, Country = ? 
    WHERE LocationID = (SELECT LocationID FROM RescueTeam WHERE TeamID = ?);
  `;

  db.query(updateLocationQuery, [City, State, Country, teamId], (err, result) => {
    if (err) {
      console.error('Error updating location:', err);
      return res.status(500).json({ error: 'Failed to update location data' });
    }

    // Now update Rescue Team Table
    const updateRescueTeamQuery = `
      UPDATE RescueTeam 
      SET TeamName = ?, TeamType = ?, ContactNumber = ?
      WHERE TeamID = ?;
    `;

    db.query(updateRescueTeamQuery, [TeamName, TeamType, ContactNumber, teamId], (err, result) => {
      if (err) {
        console.error('Error updating rescue team:', err);
        return res.status(500).json({ error: 'Failed to update rescue team data' });
      }
      res.json({ message: 'Rescue Team updated successfully' });
    });
  });
});


router.delete('/api/delete/:id', (req, res) => {
  const teamId = req.params.id;

  // Delete the rescue team entry from the database
  const deleteRescueTeamQuery = 'DELETE FROM RescueTeam WHERE TeamID = ?';

  db.query(deleteRescueTeamQuery, [teamId], (err, result) => {
    if (err) {
      console.error('Error deleting rescue team:', err);
      return res.status(500).json({ error: 'Failed to delete rescue team' });
    }

    // Send response after successful deletion
    res.json({ message: 'Rescue team deleted successfully' });
  });
});





module.exports = router;