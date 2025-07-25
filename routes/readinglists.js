const router = require('express').Router();
const { ReadingList, Blog, User } = require('../models');
const tokenExtractor = require('../utils/tokenExtractor');
const userExtractor = require('../utils/userExtractor');

router.post('/', async (req, res) => {
  try {
    const { blogId, userId } = req.body;

    const blog = await Blog.findByPk(blogId);
    const user = await User.findByPk(userId);

    if (!blog || !user) {
      return res.status(400).json({ error: 'Invalid blogId or userId' });
    }

    const reading = await ReadingList.create({
      blogId,
      userId,
    });

    res.status(201).json(reading);
  } catch (error) {
    console.error('POST /api/readinglists error:', error); // << log full error here
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.put('/:id', tokenExtractor, userExtractor, async (req, res) => {
  try {
    const reading = await ReadingList.findByPk(req.params.id);

    if (!reading) {
      return res.status(404).json({ error: 'Reading list entry not found' });
    }

    if (reading.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    reading.read = req.body.read;
    await reading.save();

    res.json(reading);
  } catch (error) {
    console.error('Error in PUT /api/readinglists/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
