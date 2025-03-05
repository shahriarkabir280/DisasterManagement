const express = require('express');
const path = require('path');
const router = express.Router();

// Serve the Victims HTML page
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views', 'volunteers.html'));
});

module.exports = router;