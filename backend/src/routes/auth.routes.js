const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { authMiddleware } = require('../middleware/auth.middleware');

const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many auth attempts' } } });

router.post('/signup', authLimiter, async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Name, email and password required' } });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Password must be at least 6 characters' } });
    }
    const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ success: false, error: { code: 'DUPLICATE', message: 'Email already registered' } });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await query('INSERT INTO users (name, email, password_hash, phone) VALUES (?, ?, ?, ?)', [name, email, passwordHash, phone || null]);
    const token = jwt.sign({ userId: result.insertId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' });
    const refreshToken = jwt.sign({ userId: result.insertId, type: 'refresh' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' });
    res.status(201).json({ success: true, data: { user: { id: result.insertId, name, email, phone }, token, refreshToken } });
  } catch (err) { next(err); }
});

router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Email and password required' } });
    }
    const users = await query('SELECT * FROM users WHERE email = ? AND is_active = TRUE', [email]);
    if (!users.length) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    }
    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    }
    await query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' });
    const refreshToken = jwt.sign({ userId: user.id, type: 'refresh' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' });
    res.json({ success: true, data: { user: { id: user.id, name: user.name, email: user.email, phone: user.phone }, token, refreshToken } });
  } catch (err) { next(err); }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Refresh token required' } });
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') throw new Error('Invalid token type');
    const token = jwt.sign({ userId: decoded.userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' });
    res.json({ success: true, data: { token } });
  } catch (err) {
    res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid refresh token' } });
  }
});

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const members = await query(
      'SELECT bm.*, b.id as business_id, b.name as business_name, b.business_type FROM business_members bm JOIN businesses b ON bm.business_id = b.id WHERE bm.user_id = ? AND bm.is_active = TRUE',
      [req.user.id]
    );
    res.json({ success: true, data: { user: req.user, business: members[0] || null } });
  } catch (err) { next(err); }
});

router.patch('/password', authMiddleware, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const users = await query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!valid) return res.status(400).json({ success: false, error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect' } });
    if (newPassword.length < 6) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'New password must be at least 6 characters' } });
    const hash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ success: true, data: { message: 'Password updated' } });
  } catch (err) { next(err); }
});

router.post('/forgot-password', authLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    const users = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (!users.length) return res.json({ success: true, data: { message: 'If email exists, reset link sent' } });
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    await query('INSERT INTO reset_password_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))', [users[0].id, token]);
    // In production, send email here
    res.json({ success: true, data: { message: 'If email exists, reset link sent', token } }); // token included for dev only
  } catch (err) { next(err); }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const tokens = await query('SELECT * FROM reset_password_tokens WHERE token = ? AND used = FALSE AND expires_at > NOW()', [token]);
    if (!tokens.length) return res.status(400).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired reset token' } });
    const hash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, tokens[0].user_id]);
    await query('UPDATE reset_password_tokens SET used = TRUE WHERE id = ?', [tokens[0].id]);
    res.json({ success: true, data: { message: 'Password reset successful' } });
  } catch (err) { next(err); }
});

module.exports = router;
