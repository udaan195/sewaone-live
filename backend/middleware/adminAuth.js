const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Header se token nikalein
  const token = req.header('x-auth-token');

  // Check karein token hai ya nahi
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // Verify karein
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check karein ki ye 'admin' token hai ya nahi
    if (!decoded.admin) {
        return res.status(401).json({ msg: 'Not an admin token' });
    }

    req.admin = decoded.admin; // Admin data request mein jodein
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};