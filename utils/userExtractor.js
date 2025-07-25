const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Session = require('../models/session');

const userExtractor = async (req, res, next) => {
  try {
    const decoded = jwt.verify(req.token, process.env.SECRET);
    const session = await Session.findOne({ where: { token: req.token } });
    if (!session) return res.status(401).json({ error: 'Invalid session' });

    const user = await User.findByPk(decoded.id);
    if (!user || user.disabled) {
      return res.status(401).json({ error: 'User disabled or not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = userExtractor;
