const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const webauthnRoutes = require('./webauthnRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:5173',
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
