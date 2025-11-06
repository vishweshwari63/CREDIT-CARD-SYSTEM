const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

let otpStore = {}; // { email: { otp, expires } }
const OTP_EXPIRATION = 5 * 60 * 1000; // 5 mins

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Signup
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  try {
    await pool.query(
      "INSERT INTO users (name, email, password, first_time) VALUES ($1,$2,$3,$4)",
      [name, email, hashed, true]
    );
    res.json({ message: "User registered" });
  } catch (err) {
    res.status(400).json({ message: "Email already exists" });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (result.rows.length === 0) return res.status(400).json({ message: "User not found" });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid password" });

    if (user.first_time) {
      const otp = Math.floor(100000 + Math.random() * 900000);
      otpStore[email] = { otp, expires: Date.now() + OTP_EXPIRATION };
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "OTP for First-Time Login",
        text: `Your OTP is ${otp}`
      });
      return res.json({ firstTime: true, message: "OTP sent to email" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ firstTime: false, token, userId: user.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore[email];
  if (!record || record.expires < Date.now()) return res.status(400).json({ message: "OTP expired or invalid" });
  if (Number(otp) !== record.otp) return res.status(400).json({ message: "Invalid OTP" });

  delete otpStore[email];
  await pool.query("UPDATE users SET first_time=false WHERE email=$1", [email]);

  const user = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
  const token = jwt.sign({ userId: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: "1d" });

  res.json({ token, userId: user.rows[0].id });
});

// Send OTP for forgot password
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
  if (result.rows.length === 0) return res.status(400).json({ message: "User not found" });

  const otp = Math.floor(100000 + Math.random() * 900000);
  otpStore[email] = { otp, expires: Date.now() + OTP_EXPIRATION };

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset OTP",
    text: `Your OTP is ${otp}`
  });

  res.json({ message: "OTP sent to email" });
});

// Reset password
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const record = otpStore[email];
  if (!record || record.expires < Date.now()) return res.status(400).json({ message: "OTP expired or invalid" });
  if (Number(otp) !== record.otp) return res.status(400).json({ message: "Invalid OTP" });

  const hashed = await bcrypt.hash(newPassword, 10);
  await pool.query("UPDATE users SET password=$1 WHERE email=$2", [hashed, email]);
  delete otpStore[email];

  res.json({ message: "Password reset successful" });
});
const adminRoutes = require('./routes/admin_pg');
app.use('/api/admin', adminRoutes);

module.exports = router;
