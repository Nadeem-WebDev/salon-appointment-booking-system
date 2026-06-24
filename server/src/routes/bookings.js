import express from 'express';
import {
  listBookings,
  getQueue,
  updateBooking,
  deleteBooking,
  requestOtp,
  verifyOtpAndBook
} from '../controllers/bookingsController.js'; // Ensure the .js extension is included

const router = express.Router();

// Existing routes
router.get('/', listBookings);
router.get('/queue', getQueue);
router.put('/:id', updateBooking);
router.delete('/:id', deleteBooking);

// New OTP Flow routes
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtpAndBook);

export default router;