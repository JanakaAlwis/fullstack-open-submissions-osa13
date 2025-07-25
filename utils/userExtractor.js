const jwt = require('jsonwebtoken');
const User = require('../models/user')

module.exports = async (req, res, next) => {
  try {
    const decodedToken = jwt.verify(req.token, process.env.SECRET);
    const user = await User.findByPk(decodedToken.id);
    if (!user) {
      return res.status(401).json({ error: 'invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'token invalid or missing' });
  }
};
