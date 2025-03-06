const express = require('express');
const path = require('path');
const db = require('../config/db'); // Import MySQL connection
const router = express.Router();
const moment = require('moment');

// Serve the Victims HTML page
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views', 'rescueoperations.html'));
});


router.get('/api', (req, res) => {
  const query = `
    SELECT ro.OperationID, 
           d.DisasterType AS DisasterName, 
           rt.TeamName, 
           CONCAT(l.City, ', ', l.State, ', ', l.Country) AS AffectedArea, 
           ro.StartDate, 
           ro.EndDate, 
           ro.Status
    FROM RescueOperation ro
    JOIN Disaster d ON ro.DisasterID = d.DisasterID
    JOIN RescueTeam rt ON ro.TeamID = rt.TeamID
    JOIN Location l ON d.LocationID = l.LocationID
    LIMIT 50;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error fetching rescue operations from the database');
    }
    res.json(results);
  });
});



router.get('/api/search', (req, res) => {
  const searchQuery = req.query.query || '';

  const query = `
    SELECT ro.OperationID, 
           d.DisasterType AS DisasterName, 
           rt.TeamName, 
           CONCAT(l.City, ', ', l.State, ', ', l.Country) AS AffectedArea, 
           ro.StartDate, 
           ro.EndDate, 
           ro.Status
    FROM RescueOperation ro
    JOIN Disaster d ON ro.DisasterID = d.DisasterID
    JOIN RescueTeam rt ON ro.TeamID = rt.TeamID
    JOIN Location l ON d.LocationID = l.LocationID
    WHERE LOWER(d.DisasterType) LIKE LOWER(?) 
       OR LOWER(rt.TeamName) LIKE LOWER(?) 
       OR LOWER(l.City) LIKE LOWER(?) 
       OR LOWER(l.State) LIKE LOWER(?) 
       OR LOWER(l.Country) LIKE LOWER(?) 
       OR LOWER(ro.Status) LIKE LOWER(?)
    LIMIT 50;
  `;

  const wildcardSearch = `%${searchQuery}%`;
  const params = [wildcardSearch, wildcardSearch, wildcardSearch, wildcardSearch, wildcardSearch, wildcardSearch];

  db.query(query, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error fetching search results');
    }
    res.json(results);
  });
});


router.post('/rescue/api/add', (req, res) => {
  if (!req.body) {
      return res.status(400).json({ error: 'Request body is missing' });
  }

  let { DisasterID, RescueTeam, NumberOfPeopleRescued, Status, DateOfRescue, Notes } = req.body;

  console.log(`Received data: ${DisasterID}, ${RescueTeam}, ${NumberOfPeopleRescued}, ${Status}, ${DateOfRescue}, ${Notes}`);

  if (!DisasterID || !RescueTeam || !NumberOfPeopleRescued || !Status || !DateOfRescue || !Notes) {
      return res.status(400).json({ error: 'All fields are required' });
  }

  try {
      const formattedDate = new Date(DateOfRescue).toISOString().split('T')[0];

      // Ensure the DisasterID exists
      const disasterQuery = `SELECT DisasterID FROM Disaster WHERE DisasterID = ?`;
      
      db.query(disasterQuery, [DisasterID], (err, disasterResult) => {
          if (err) {
              console.error('Error checking disaster:', err);
              return res.status(500).json({ error: 'Failed to check disaster existence' });
          }

          if (disasterResult.length === 0) {
              return res.status(400).json({ error: 'Invalid DisasterID' });
          }

          // Insert rescue operation
          const insertRescueQuery = `
              INSERT INTO RescueOperations (DisasterID, RescueTeam, NumberOfPeopleRescued, Status, DateOfRescue, Notes)
              VALUES (?, ?, ?, ?, ?, ?)`;

          const rescueValues = [DisasterID, RescueTeam, NumberOfPeopleRescued, Status, formattedDate, Notes];

          db.query(insertRescueQuery, rescueValues, (err, result) => {
              if (err) {
                  console.error('Error inserting rescue operation:', err);
                  return res.status(500).json({ error: 'Failed to insert rescue data' });
              }
              res.json({ message: 'Rescue operation added successfully', id: result.insertId });
          });
      });

  } catch (error) {
      console.error('Error processing date:', error);
      res.status(400).json({ error: 'Invalid date format' });
  }
});


// Add a new rescue operation

router.post('/api/add', (req, res) => {
  if (!req.body) {
      return res.status(400).json({ error: 'Request body is missing' });
  }

  let { DisasterName, TeamName, TeamType, ContactNumber, StartDate, EndDate, Status, City, State, Country, SeverityLevel, Description } = req.body;

  console.log(`Received data: ${DisasterName}, ${TeamName}, ${TeamType}, ${ContactNumber}, ${StartDate}, ${EndDate}, ${Status}, ${City}, ${State}, ${Country},${SeverityLevel}, ${Description}`);

  if (!DisasterName || !TeamName || !TeamType || !StartDate || !Status || !City || !State || !Country) {
      return res.status(400).json({ error: 'All fields except EndDate and ContactNumber are required' });
  }

  // Ensure StartDate and EndDate are in YYYY-MM-DD format
  try {
      const formattedStartDate = new Date(StartDate).toISOString().split('T')[0];
      const formattedEndDate = EndDate ? new Date(EndDate).toISOString().split('T')[0] : null;

      // Check if location already exists
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

              // Check if disaster already exists
              checkOrInsertDisaster(locationID);
          } else {
              // Insert new location
              const insertLocationQuery = `INSERT INTO Location (City, State, Country) VALUES (?, ?, ?)`;
              
              db.query(insertLocationQuery, locationValues, (err, result) => {
                  if (err) {
                      console.error('Error inserting location:', err);
                      return res.status(500).json({ error: 'Failed to insert location' });
                  }

                  const newLocationID = result.insertId;
                  // Insert disaster
                  checkOrInsertDisaster(newLocationID);
              });
          }
      });

      // Function to check and insert Disaster
      function checkOrInsertDisaster(locationID) {
          const disasterQuery = `SELECT DisasterID FROM Disaster WHERE DisasterType = ? AND LocationID = ? AND SeverityLevel = ?`;
          const disasterValues = [DisasterName, locationID,SeverityLevel];

          db.query(disasterQuery, disasterValues, (err, disasterResult) => {
              if (err) {
                  console.error('Error checking disaster:', err);
                  return res.status(500).json({ error: 'Failed to check disaster' });
              }

              if (disasterResult.length > 0) {
                  // Disaster exists, use the existing DisasterID
                  const disasterID = disasterResult[0].DisasterID;
                  // Check if Rescue Team exists
                  checkOrInsertRescueTeam(locationID, disasterID);
              } else {
                  // Insert new disaster
                  const insertDisasterQuery = `INSERT INTO Disaster (DisasterType, LocationID, DateOccurred, SeverityLevel, Description) 
                      VALUES (?, ?, ?, ?, ?)`;
                  const disasterValues = [DisasterName, locationID, formattedStartDate, SeverityLevel, Description];

                  db.query(insertDisasterQuery, disasterValues, (err, result) => {
                      if (err) {
                          console.error('Error inserting disaster:', err);
                          return res.status(500).json({ error: 'Failed to insert disaster' });
                      }

                      const newDisasterID = result.insertId;
                      // Check if Rescue Team exists
                      checkOrInsertRescueTeam(locationID, newDisasterID);
                  });
              }
          });
      }

      // Function to check and insert Rescue Team
      function checkOrInsertRescueTeam(locationID, disasterID) {
          const rescueTeamQuery = `SELECT TeamID FROM RescueTeam WHERE TeamName = ? AND LocationID = ?`;
          const rescueTeamValues = [TeamName, locationID];

          db.query(rescueTeamQuery, rescueTeamValues, (err, rescueTeamResult) => {
              if (err) {
                  console.error('Error checking rescue team:', err);
                  return res.status(500).json({ error: 'Failed to check rescue team' });
              }

              if (rescueTeamResult.length > 0) {
                  // Rescue team exists, use the existing TeamID
                  const teamID = rescueTeamResult[0].TeamID;
                  insertRescueOperation(disasterID, teamID);
              } else {
                  // Insert new rescue team
                  const insertRescueTeamQuery = `INSERT INTO RescueTeam (TeamName, TeamType, ContactNumber, LocationID) 
                      VALUES (?, ?, ?, ?)`;
                  const rescueTeamValues = [TeamName, TeamType, ContactNumber, locationID];

                  db.query(insertRescueTeamQuery, rescueTeamValues, (err, result) => {
                      if (err) {
                          console.error('Error inserting rescue team:', err);
                          return res.status(500).json({ error: 'Failed to insert rescue team' });
                      }

                      const newTeamID = result.insertId;
                      insertRescueOperation(disasterID, newTeamID);
                  });
              }
          });
      }

      // Function to insert the rescue operation using the obtained TeamID and DisasterID
      function insertRescueOperation(disasterID, teamID) {
          const insertRescueOperationQuery = `
              INSERT INTO RescueOperation (DisasterID, TeamID, StartDate, EndDate, Status)
              VALUES (?, ?, ?, ?, ?)`;

          const rescueOperationValues = [disasterID, teamID, formattedStartDate, formattedEndDate, Status];

          db.query(insertRescueOperationQuery, rescueOperationValues, (err, result) => {
              if (err) {
                  console.error('Error inserting rescue operation:', err);
                  return res.status(500).json({ error: 'Failed to insert rescue operation data' });
              }
              res.json({ message: 'Rescue operation added successfully', id: result.insertId });
          });
      }
  } catch (error) {
      console.error('Error processing date:', error);
      res.status(400).json({ error: 'Invalid date format' });
  }
});





// Get rescue operation by ID
router.get('/api/:id', (req, res) => {
  const rescueOperationId = req.params.id;

  const query = `
   SELECT ro.OperationID, ro.StartDate, ro.EndDate, ro.Status, 
           t.TeamName, t.TeamType, t.ContactNumber, 
           d.DisasterType AS DisasterName, 
           l.City, l.State, l.Country, d.SeverityLevel
    FROM RescueOperation ro
    JOIN Disaster d ON ro.DisasterID = d.DisasterID
    JOIN RescueTeam t ON ro.TeamID = t.TeamID
    JOIN Location l ON d.LocationID = l.LocationID
    WHERE ro.OperationID = ?;
  `;

  db.query(query, [rescueOperationId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error fetching rescue operation data' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Rescue operation not found' });
    }
    res.json(results[0]);
  });
});

// Update rescue operation
router.put('/api/update/:id', (req, res) => {
  const rescueOperationId = req.params.id;
  console.log('Updating rescue operation:', rescueOperationId);
  const { DisasterName, TeamName, TeamType, ContactNumber, StartDate, EndDate, Status, City, State, Country, SeverityLevel, Description } = req.body;

  if (!DisasterName || !TeamName || !TeamType || !StartDate || !Status || !City || !State || !Country) {
    return res.status(400).json({ error: 'All fields except EndDate and ContactNumber are required' });
  }

  try {
    const formattedStartDate = new Date(StartDate).toISOString().split('T')[0];
    const formattedEndDate = EndDate ? new Date(EndDate).toISOString().split('T')[0] : null;

    // Fetch LocationID
    const locationQuery = `SELECT LocationID FROM Location WHERE City = ? AND State = ? AND Country = ?`;
    const locationValues = [City, State, Country];

    db.query(locationQuery, locationValues, (err, locationResult) => {
      if (err) {
        console.error('Error checking location:', err);
        return res.status(500).json({ error: 'Failed to check location' });
      }

      if (locationResult.length > 0) {
        const locationID = locationResult[0].LocationID;
        // Update disaster and rescue team details
        updateDisasterAndTeam(locationID);
      } else {
        return res.status(400).json({ error: 'Location does not exist' });
      }
    });

    // Update disaster and rescue team
    function updateDisasterAndTeam(locationID) {
      console.log('Updating disaster and rescue team');
      const updateDisasterQuery = `
        UPDATE Disaster 
        SET DisasterType = ?, LocationID = ?, DateOccurred = ?, SeverityLevel = ?, Description = ? 
        WHERE DisasterID = (SELECT DisasterID FROM RescueOperation WHERE OperationID = ?)
      `;
      console.log(DisasterName, locationID, formattedStartDate, SeverityLevel, Description, rescueOperationId);
      db.query(updateDisasterQuery, [DisasterName, locationID, formattedStartDate, SeverityLevel, Description, rescueOperationId], (err) => {
        if (err) {
          console.error('Error updating disaster:', err);
          return res.status(500).json({ error: 'Failed to update disaster' });
        }

        const updateRescueTeamQuery = `
          UPDATE RescueTeam 
          SET TeamName = ?, TeamType = ?, ContactNumber = ? 
          WHERE TeamID = (SELECT TeamID FROM RescueOperation WHERE OperationID = ?)
        `;

        db.query(updateRescueTeamQuery, [TeamName, TeamType, ContactNumber, rescueOperationId], (err) => {
          if (err) {
            console.error('Error updating rescue team:', err);
            return res.status(500).json({ error: 'Failed to update rescue team' });
          }

          const updateRescueOperationQuery = `
            UPDATE RescueOperation 
            SET StartDate = ?, EndDate = ?, Status = ? 
            WHERE OperationID = ?
          `;
  
          db.query(updateRescueOperationQuery, [formattedStartDate, formattedEndDate, Status, rescueOperationId], (err) => {
            if (err) {
              console.error('Error updating rescue operation:', err);
              return res.status(500).json({ error: 'Failed to update rescue operation' });
            }
            res.json({ message: 'Rescue operation updated successfully' });
          });
        });
      });
    }
  } catch (error) {
    console.error('Error processing date:', error);
    res.status(400).json({ error: 'Invalid date format' });
  }
});



// Delete a rescue operation (without deleting disaster or location)
router.delete('/api/delete/:id', (req, res) => {
  const rescueOperationId = req.params.id;

  // Delete the rescue operation entry
  const deleteRescueOperationQuery = 'DELETE FROM RescueOperation WHERE OperationID = ?';

  db.query(deleteRescueOperationQuery, [rescueOperationId], (err, result) => {
    if (err) {
      console.error('Error deleting rescue operation:', err);
      return res.status(500).json({ error: 'Failed to delete rescue operation' });
    }

    // If the deletion is successful
    res.json({ message: 'Rescue operation deleted successfully' });
  });
});





module.exports = router;