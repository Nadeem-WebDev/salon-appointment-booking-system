// Example of how your main server file should look:
import express from 'express';
import cors from 'cors';
import 'dotenv/config'; // Modern ESM way to load dotenv
import path from 'path';

import bookingsRoutes from './routes/bookings.js';

const app = express();
const __dirname = path.resolve();

app.use(cors());
app.use(express.json());

app.use('/api/bookings', bookingsRoutes);

if(process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname,"../client/dist")))
    app.get(/(.*)/  , (req, res)=>{
        res.sendFile(path.join(__dirname, "../client", "dist", "index.html"))
    })
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));