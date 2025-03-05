const express = require('express');
const path = require('path');
const db = require('../config/db'); // Import MySQL connection
const router = express.Router();


// Serve the Victims HTML page
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views', 'victims.html'));
});


// Fetch all victim data without filters
router.get('/api', (req, res) => {
  const query = `
  SELECT v.VictimID, 
         v.FirstName, 
         v.LastName, 
         v.Age, 
         v.Gender, 
         v.ContactNumber, 
         v.Address, 
         v.Status, 
         CONCAT(l.City, ', ', l.State, ', ', l.Country) AS Location
  FROM Victim v
  JOIN Location l ON v.LocationID = l.LocationID
  LIMIT 50;
`;

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error fetching victim data from the database');
    }
    res.json(results); // Send the fetched data as JSON to the frontend
  });
});



// Search victims based on query
router.get('/api/search', (req, res) => {
  const searchQuery = req.query.query || '';  // Default empty string

  let query = `
  SELECT v.VictimID, 
         v.FirstName, 
         v.LastName, 
         v.Age, 
         v.Gender, 
         v.ContactNumber, 
         v.Address, 
         v.Status, 
         CONCAT(l.City, ', ', l.State, ', ', l.Country) AS Location
  FROM Victim v
  JOIN Location l ON v.LocationID = l.LocationID
  WHERE LOWER(v.VictimID) LIKE LOWER(?) 
     OR LOWER(v.FirstName) LIKE LOWER(?) 
     OR LOWER(v.LastName) LIKE LOWER(?) 
     OR LOWER(v.Age) LIKE LOWER(?) 
     OR LOWER(v.Gender) LIKE LOWER(?) 
     OR LOWER(v.ContactNumber) LIKE LOWER(?) 
     OR LOWER(v.Address) LIKE LOWER(?) 
     OR LOWER(v.Status) LIKE LOWER(?) 
     OR LOWER(CONCAT(l.City, ', ', l.State, ', ', l.Country)) LIKE LOWER(?)
  LIMIT 50;
`;

  const wildcardSearch = `%${searchQuery}%`;
  const params = [
    wildcardSearch, wildcardSearch, wildcardSearch, wildcardSearch, wildcardSearch,
    wildcardSearch, wildcardSearch, wildcardSearch, wildcardSearch
  ];

  db.query(query, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error fetching data from the database');
    }
    res.json(results); // Send data back to frontend
  });
});


// API route for adding a victim
router.post('/api/addVictim', (req, res) => {
  if (!req.body) {
    return res.status(400).json({ error: 'Request body is missing' });
  }

  let { FirstName, LastName, Age, Gender, ContactNumber, Address, Status, City, State, Country } = req.body;

  console.log(`Received data: ${FirstName}, ${LastName}, ${Age}, ${Gender}, ${ContactNumber}, ${Address}, ${Status}, ${City}, ${State}, ${Country}`);

  if (!FirstName || !LastName || !Age || !Gender || !Status || !City || !State || !Country) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Insert location
  const locationQuery = `SELECT LocationID FROM Location WHERE City = ? AND State = ? AND Country = ?`;
  const locationValues = [City, State, Country];

  db.query(locationQuery, locationValues, (err, locationResult) => {
    if (err) {
      console.error('Error checking location:', err);
      return res.status(500).json({ error: 'Failed to check location' });
    }

    if (locationResult.length > 0) {
      // Location exists, use the existing LocationID
      const locationID = locationResult[0].LocationID;
      insertVictim(locationID);
    } else {
      // Insert new location
      const insertLocationQuery = `INSERT INTO Location (City, State, Country) VALUES (?, ?, ?)`;

      db.query(insertLocationQuery, locationValues, (err, result) => {
        if (err) {
          console.error('Error inserting location:', err);
          return res.status(500).json({ error: 'Failed to insert location' });
        }

        const newLocationID = result.insertId;
        insertVictim(newLocationID);
      });
    }
  });

  // Function to insert the victim using the obtained LocationID
  function insertVictim(locationID) {
    const insertVictimQuery = `
      INSERT INTO Victim (FirstName, LastName, Age, Gender, ContactNumber, Address, Status, LocationID)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    const victimValues = [FirstName, LastName, Age, Gender, ContactNumber, Address, Status, locationID];

    db.query(insertVictimQuery, victimValues, (err, result) => {
      if (err) {
        console.error('Error inserting victim:', err);
        return res.status(500).json({ error: 'Failed to insert victim data' });
      }
      res.json({ message: 'Victim added successfully', id: result.insertId });
    });
  }
});



// Fetch a single victim
router.get('/api/:id', (req, res) => {
  const victimId = req.params.id;

  const query = `
    SELECT v.VictimID, v.FirstName, v.LastName, v.Age, v.Gender, 
           v.ContactNumber, v.Address, v.Status, 
           l.City, l.State, l.Country
    FROM Victim v
    JOIN Location l ON v.LocationID = l.LocationID
    WHERE v.VictimID = ?;
  `;

  db.query(query, [victimId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error fetching victim data' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Victim not found' });
    }
    res.json(results[0]);
  });
});

// Update a victim and associated location
router.put('/api/update/:id', (req, res) => {
  const victimId = req.params.id;
  const { FirstName, LastName, Age, Gender, ContactNumber, Address, Status, City, State, Country } = req.body;

  if (!FirstName || !LastName || !Age || !Gender || !Status || !City || !State || !Country) {
    return res.status(400).json({ error: 'All required fields must be filled' });
  }

  // Update Location Table First
  const updateLocationQuery = `
    UPDATE Location 
    SET City = ?, State = ?, Country = ? 
    WHERE LocationID = (SELECT LocationID FROM Victim WHERE VictimID = ?);
  `;

  db.query(updateLocationQuery, [City, State, Country, victimId], (err, result) => {
    if (err) {
      console.error('Error updating location:', err);
      return res.status(500).json({ error: 'Failed to update location data' });
    }

    // Now update Victim Table
    const updateVictimQuery = `
      UPDATE Victim 
      SET FirstName = ?, LastName = ?, Age = ?, Gender = ?, 
          ContactNumber = ?, Address = ?, Status = ?
      WHERE VictimID = ?;
    `;

    db.query(updateVictimQuery, [FirstName, LastName, Age, Gender, ContactNumber, Address, Status, victimId], (err, result) => {
      if (err) {
        console.error('Error updating victim:', err);
        return res.status(500).json({ error: 'Failed to update victim data' });
      }
      res.json({ message: 'Victim updated successfully' });
    });
  });
});



// Delete a victim and associated location
router.delete('/api/delete/:id', (req, res) => {
  const victimId = req.params.id;

  // Find the LocationID associated with the victim
  const findLocationQuery = 'SELECT LocationID FROM Victim WHERE VictimID = ?';

  db.query(findLocationQuery, [victimId], (err, results) => {
    if (err) {
      console.error('Error finding location:', err);
      return res.status(500).json({ error: 'Failed to find location data' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Victim not found' });
    }

    const locationId = results[0].LocationID;

    // Delete the victim entry
    const deleteVictimQuery = 'DELETE FROM Victim WHERE VictimID = ?';

    db.query(deleteVictimQuery, [victimId], (err, result) => {
      if (err) {
        console.error('Error deleting victim:', err);
        return res.status(500).json({ error: 'Failed to delete victim' });
      }

      // Check if the location is still referenced by any other victims
      const checkLocationQuery = 'SELECT COUNT(*) AS count FROM Victim WHERE LocationID = ?';

      db.query(checkLocationQuery, [locationId], (err, locationResult) => {
        if (err) {
          console.error('Error checking location reference:', err);
          return res.status(500).json({ error: 'Failed to check location reference' });
        }

        if (locationResult[0].count === 0) {
          // If no other victims reference this location, delete it
          const deleteLocationQuery = 'DELETE FROM Location WHERE LocationID = ?';

          db.query(deleteLocationQuery, [locationId], (err, locationDeleteResult) => {
            if (err) {
              console.error('Error deleting location:', err);
              return res.status(500).json({ error: 'Failed to delete location' });
            }
            res.json({ message: 'Victim and associated location deleted successfully' });
          });
        } else {
          res.json({ message: 'Victim deleted successfully' });
        }
      });
    });
  });
});




module.exports = router;