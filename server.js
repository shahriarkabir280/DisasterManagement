require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const app = express();

// Security: hide X-Powered-By header
app.disable('x-powered-by');

// Use Helmet to set secure HTTP headers
app.use(helmet());

// Basic rate limiter to reduce brute-force and DOS risk
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Serve static files (CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON with a size limit and to parse urlencoded bodies
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // For form data

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
