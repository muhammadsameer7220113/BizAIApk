const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

exports.authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Access token required' } });
    }
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const users = await query('SELECT id, name, email, phone FROM users WHERE id = ? AND is_active = TRUE', [decoded.userId]);
    if (!users.length) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not found' } });
    }
    req.user = users[0];

    const members = await query(
      'SELECT bm.*, b.id as business_id, b.name as business_name FROM business_members bm JOIN businesses b ON bm.business_id = b.id WHERE bm.user_id = ? AND bm.is_active = TRUE',
      [decoded.userId]
    );
    if (members.length) {
      req.business = members[0];
    }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: { code: 'TOKEN_EXPIRED', message: 'Token expired' } });
    }
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }
};

exports.requireBusiness = (req, res, next) => {
  if (!req.business || !req.business.business_id) {
    return res.status(403).json({ success: false, error: { code: 'NO_BUSINESS', message: 'No business found. Please create a business first.' } });
  }
  next();
};
