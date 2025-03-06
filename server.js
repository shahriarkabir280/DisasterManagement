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
const victimsRoutes = require('./routes/victimsRoutes'); // Import Victims routes
const rescueoperationsRoutes = require('./routes/rescueoperationsRoutes');
const volunteersRoutes = require('./routes/volunteersRoutes');
const donationsRoutes = require('./routes/donationsRoutes');
const rescueteamsRoutes = require('./routes/rescueteamsRoutes');

app.use('/disasters', disasterRoutes);
app.use('/victims', victimsRoutes); // Use Victims routes
app.use('/rescueoperations', rescueoperationsRoutes);
app.use('/volunteers', volunteersRoutes);
app.use('/donations', donationsRoutes);
app.use('/rescueteams', rescueteamsRoutes);



// Default route redirects to disasters
app.get('/', (req, res) => {
  res.redirect('/disasters');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
