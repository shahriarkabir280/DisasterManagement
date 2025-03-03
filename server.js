const express = require('express');
const path = require('path');
const app = express();


// Serve static files (CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));


// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For form data

// Import Routes AFTER using middleware
const disasterRoutes = require('./routes/disastersRoutes');
app.use('/disasters', disasterRoutes);

// Default route redirects to disasters
app.get('/', (req, res) => {
  res.redirect('/disasters');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
