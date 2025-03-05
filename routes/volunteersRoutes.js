const express = require('express');
const path = require('path');
const db = require('../config/db'); // Import MySQL connection
const router = express.Router();


// Serve the Victims HTML page
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views', 'volunteers.html'));
});



// Fetch all volunteer data without filters
router.get('/api', (req, res) => {
  const query = `
  SELECT v.VolunteerID, 
         v.FirstName, 
         v.LastName, 
         v.ContactNumber, 
         v.Skills, 
         v.AvailabilityStatus
  FROM Volunteer v
  LIMIT 50;
`;

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error fetching volunteer data from the database');
    }
    res.json(results); // Send the fetched data as JSON to the frontend
  });
});

// Search volunteers based on query
router.get('/api/search', (req, res) => {
  const searchQuery = req.query.query || '';  // Default empty string

  let query = `
  SELECT v.VolunteerID, 
         v.FirstName, 
         v.LastName, 
         v.ContactNumber, 
         v.Skills, 
         v.AvailabilityStatus
  FROM Volunteer v
  WHERE LOWER(v.VolunteerID) LIKE LOWER(?) 
     OR LOWER(v.FirstName) LIKE LOWER(?) 
     OR LOWER(v.LastName) LIKE LOWER(?) 
     OR LOWER(v.ContactNumber) LIKE LOWER(?) 
     OR LOWER(v.Skills) LIKE LOWER(?) 
     OR LOWER(v.AvailabilityStatus) LIKE LOWER(?)
  LIMIT 50;
`;

  const wildcardSearch = `%${searchQuery}%`;
  const params = [
    wildcardSearch, wildcardSearch, wildcardSearch, wildcardSearch, wildcardSearch, wildcardSearch
  ];

  db.query(query, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error fetching data from the database');
    }
    res.json(results); // Send data back to frontend
  });
});


// API route for adding a volunteer
router.post('/api/addVolunteer', (req, res) => {
  if (!req.body) {
    return res.status(400).json({ error: 'Request body is missing' });
  }

  let { FirstName, LastName, ContactNumber, Skills, AvailabilityStatus } = req.body;

  console.log(`Received data: ${FirstName}, ${LastName}, ${ContactNumber}, ${Skills}, ${AvailabilityStatus}`);

  if (!FirstName || !LastName || !AvailabilityStatus) {
    return res.status(400).json({ error: 'First Name, Last Name, and Availability Status are required' });
  }

  // Insert volunteer data into the Volunteer table
  const insertVolunteerQuery = `
    INSERT INTO Volunteer (FirstName, LastName, ContactNumber, Skills, AvailabilityStatus)
    VALUES (?, ?, ?, ?, ?)`;

  const volunteerValues = [FirstName, LastName, ContactNumber, Skills, AvailabilityStatus];

  db.query(insertVolunteerQuery, volunteerValues, (err, result) => {
    if (err) {
      console.error('Error inserting volunteer:', err);
      return res.status(500).json({ error: 'Failed to insert volunteer data' });
    }
    res.json({ message: 'Volunteer added successfully', id: result.insertId });
  });
});



// volunteersRoutes.js (Backend)

// API route to fetch volunteer details for editing
router.get('/api/:id', (req, res) => {
  const volunteerId = req.params.id;

  // Query to get the volunteer details from the database
  const query = 'SELECT * FROM Volunteer WHERE VolunteerID = ?';
  
  db.query(query, [volunteerId], (err, results) => {
    if (err) {
      console.error('Error fetching volunteer:', err);
      return res.status(500).json({ error: 'Failed to fetch volunteer' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }

    res.json(results[0]);  // Return volunteer details
  });
});

// API route to update volunteer details
router.put('/api/update/:id', (req, res) => {
  const volunteerId = req.params.id;
  const { FirstName, LastName, ContactNumber, Skills, AvailabilityStatus } = req.body;

  // Query to update volunteer details in the database
  const updateQuery = `
    UPDATE Volunteer SET 
    FirstName = ?, 
    LastName = ?, 
    ContactNumber = ?, 
    Skills = ?, 
    AvailabilityStatus = ?
    WHERE VolunteerID = ?
  `;

  db.query(updateQuery, [FirstName, LastName, ContactNumber, Skills, AvailabilityStatus, volunteerId], (err, result) => {
    if (err) {
      console.error('Error updating volunteer:', err);
      return res.status(500).json({ error: 'Failed to update volunteer' });
    }

    res.json({ message: 'Volunteer updated successfully' });
  });
});



// API route for deleting a volunteer
router.delete('/api/delete/:id', (req, res) => {
  const volunteerId = req.params.id;

  // First, find if the volunteer is associated with any other data (for example, tasks or events)
  const findVolunteerQuery = 'SELECT * FROM Volunteer WHERE VolunteerID = ?';

  db.query(findVolunteerQuery, [volunteerId], (err, results) => {
    if (err) {
      console.error('Error finding volunteer:', err);
      return res.status(500).json({ error: 'Failed to find volunteer' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }

    // Delete the volunteer entry
    const deleteVolunteerQuery = 'DELETE FROM Volunteer WHERE VolunteerID = ?';

    db.query(deleteVolunteerQuery, [volunteerId], (err, result) => {
      if (err) {
        console.error('Error deleting volunteer:', err);
        return res.status(500).json({ error: 'Failed to delete volunteer' });
      }

      // Optionally, you can add additional logic to check for references to this volunteer in other tables
      // (e.g., check if the volunteer is assigned to any tasks or events)

      res.json({ message: 'Volunteer deleted successfully' });
    });
  });
});

module.exports = router;



module.exports = router;