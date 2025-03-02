const express = require('express');
const path = require('path');
const app = express();
const disastersRoutes = require('./routes/disastersRoutes');

// Serve static files (CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Routes for each page (Disasters)
app.use('/disasters', disastersRoutes);

// Default route redirects to disasters
app.get('/', (req, res) => {
  res.redirect('/disasters');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
