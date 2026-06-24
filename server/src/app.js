// Example of how your main server file should look:
import express from 'express';
import cors from 'cors';
import 'dotenv/config'; // Modern ESM way to load dotenv

import bookingsRoutes from './routes/bookings.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/bookings', bookingsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));