const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const webauthnRoutes = require('./webauthnRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

const allowedOrigins = [
  process.env.WEBAUTHN_ORIGIN || 'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.json());

// Routes
app.use('/api/webauthn', webauthnRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 BioVault Backend running on http://localhost:${PORT}`);
});
