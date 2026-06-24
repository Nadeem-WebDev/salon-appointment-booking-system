# 💇 Salon Booking System (PERN Stack)

A modern, mobile-responsive full-stack web application for salon appointment scheduling. Built with the PERN stack (PostgreSQL, Express, React, Node.js), this application features live queue tracking, secure OTP email verification, and a comprehensive analytics dashboard for the salon owner.

## ✨ Features

### For Customers
* **Mobile-First Booking:** A seamless, responsive booking form that works perfectly on any device.
* **OTP Email Verification:** Prevents spam and fake bookings by requiring users to verify their email via a 6-digit OTP before confirming an appointment.
* **Live Queue Tracking:** Customers can view the current queue, their position, and estimated times in a responsive layout.

### For Salon Admin
* **Secure Dashboard:** Password-protected admin control center.
* **Analytics Overview:** Visual metrics using Recharts, including Total Revenue, Status Breakdown, and Service Popularity (Pie & Bar charts).
* **Appointment Management:** View, edit, cancel, and complete appointments.
* **Advanced Filtering:** Instantly search by name/phone/email, or filter by specific dates and appointment statuses.
* **Responsive Admin UI:** Features a full data table on desktop and a touch-friendly stacked card layout on mobile devices.

## 🛠️ Tech Stack

**Frontend:**
* React (Vite)
* Tailwind CSS (Styling)
* Recharts (Data Visualization)

**Backend:**
* Node.js & Express.js
* PostgreSQL (Database)
* Nodemailer (Email OTP Service)

---

## 🚀 Local Development Setup

### 1. Prerequisites
* [Node.js](https://nodejs.org/) installed
* [PostgreSQL](https://www.postgresql.org/) installed and running
* A Gmail account (with an App Password generated for Nodemailer)

### 2. Database Setup
1. Open your PostgreSQL terminal (psql) or pgAdmin.
2. Create a database for the project: `CREATE DATABASE salon_booking;`
3. Run the SQL script located in `server/src/init_db.sql` to generate the `bookings` table.

### 3. Environment Variables
You need to set up environment variables for both the server and the client.

**Backend (`server/.env`):**
```env
# Database Config
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=salon_booking

# Email OTP Config (Gmail App Password)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_character_app_password