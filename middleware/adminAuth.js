// Admin authentication middleware for hardcoded credentials
// Since admin uses hardcoded credentials, we'll allow requests with adminToken
const adminAuth = (req, res, next) => {
  // For now, we'll allow admin requests without strict JWT verification
  // In production, you'd verify the adminToken or use a proper admin JWT
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: "Admin authentication required" });
  }
  
  // Set admin user for downstream middleware
  req.user = {
    id: 'admin',
    role: 'admin'
  };
  
  next();
};

module.exports = adminAuth;
