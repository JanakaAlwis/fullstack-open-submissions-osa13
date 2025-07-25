const router = require('express').Router();
const { User, Blog } = require('../models');

router.get('/:id', async (req, res) => {
  const where = {};

  if (req.query.read === 'true') where.readinglist = { read: true };
  if (req.query.read === 'false') where.readinglist = { read: false };

  const user = await User.findByPk(req.params.id, {
    attributes: ['name', 'username'],
    include: {
      model: Blog,
      as: 'readings',
      attributes: ['id', 'url', 'title', 'author', 'likes', 'year'],
      through: {
        attributes: ['read', 'id'],
        where: where.readinglist || {}
      }
    }
  });

  if (!user) return res.status(404).end();
  res.json(user);
});

module.exports = router;
