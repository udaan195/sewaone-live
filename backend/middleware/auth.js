const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // 1. हेडर से टोकन निकालें
  const token = req.header('x-auth-token');

  // 2. अगर टोकन नहीं है, तो एरर दें
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // 3. टोकन को वेरिफाई (Verify) करें
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // यूज़र की ID को रिक्वेस्ट में जोड़ दें
    next(); // अगले फंक्शन पर जाएं
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};