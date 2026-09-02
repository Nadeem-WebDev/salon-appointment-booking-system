import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
  listBookings, getQueue, updateBooking, deleteBooking, requestOtp, verifyOtpAndBook, getBookedTimes, getServices, getStaff, getBusinessHours, updateBusinessHours, getBlockedDates, addBlockedDate, deleteBlockedDate, createPaymentOrder,verifyPaymentAndBook, getAdminStaff, addStaff, updateStaff, deleteStaff, getAdminServices, addService, updateService, deleteService, createManualBooking, getCustomerByPhone, checkWallet
} from '../controllers/bookingsController.js';

const router = express.Router();

// Public Routes
router.get('/services', getServices); 
router.get('/staff', getStaff);
router.get('/queue', getQueue);
router.get('/booked-times', getBookedTimes);
router.get('/settings/hours', getBusinessHours);           
router.get('/settings/blocked-dates', getBlockedDates);    

// router.post('/request-otp', requestOtp);
// router.post('/verify-otp', verifyOtpAndBook);

// Protected Admin Routes
router.get('/', verifyToken, listBookings);
router.post('/', verifyToken, createManualBooking);
router.put('/:id', verifyToken, updateBooking);
router.delete('/:id', verifyToken, deleteBooking);
router.get('/customer/:phone', verifyToken, getCustomerByPhone);
router.get('/check-wallet/:phone', checkWallet);

// Settings Routes
router.put('/settings/hours', verifyToken, updateBusinessHours);
router.post('/settings/blocked-dates', verifyToken, addBlockedDate);
router.delete('/settings/blocked-dates/:id', verifyToken, deleteBlockedDate);

// Payment Routes
router.post('/create-payment', createPaymentOrder);
router.post('/verify-payment', verifyPaymentAndBook);

// Staff Management Routes
router.get('/settings/staff', verifyToken, getAdminStaff);
router.post('/settings/staff', verifyToken, addStaff);
router.put('/settings/staff/:id', verifyToken, updateStaff);
router.delete('/settings/staff/:id', verifyToken, deleteStaff);

// Admin Service Routes
router.get('/settings/services', verifyToken, getAdminServices);
router.post('/settings/services', verifyToken, addService);
router.put('/settings/services/:id', verifyToken, updateService);
router.delete('/settings/services/:id', verifyToken, deleteService);

export default router;