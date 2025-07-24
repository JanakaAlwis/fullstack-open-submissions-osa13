require('dotenv').config();
const express = require('express');
const { ValidationError } = require('sequelize');  // Correct import here
const app = express();
const sequelize = require('./utils/db');
const Blog = require('./models/blog');
const User = require('./models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Associations
User.hasMany(Blog);
Blog.belongsTo(User);

app.use(express.json());

// Middleware to extract token from Authorization header
const tokenExtractor = (req, res, next) => {
  const auth = req.get('authorization');
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    req.token = auth.substring(7);
  }
  next();
};

// ROUTES

// GET all blogs with user info
app.get('/api/blogs', async (req, res) => {
  const blogs = await Blog.findAll({ include: { model: User, attributes: ['name', 'username'] } });
  res.json(blogs);
});

// POST blog (authentication required)
app.post('/api/blogs', tokenExtractor, async (req, res) => {
  try {
    const decodedToken = jwt.verify(req.token, process.env.SECRET);
    if (!decodedToken.id) {
      return res.status(401).json({ error: 'Token invalid' });
    }

    const user = await User.findByPk(decodedToken.id);
    if (!user) return res.status(401).json({ error: 'User not found' });

    const { title, url, author, likes } = req.body;
    if (!title || !url) return res.status(400).json({ error: 'Title and URL are required' });

    const blog = await Blog.create({
      title,
      author,
      url,
      likes: likes || 0,
      userId: user.id,
    });

    res.status(201).json(blog);
  } catch (err) {
    return res.status(401).json({ error: 'Token invalid or missing' });
  }
});

// DELETE blog (only owner can delete)
app.delete('/api/blogs/:id', tokenExtractor, async (req, res) => {
  try {
    const decodedToken = jwt.verify(req.token, process.env.SECRET);
    if (!decodedToken.id) {
      return res.status(401).json({ error: 'Token invalid' });
    }

    const blog = await Blog.findByPk(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    if (blog.userId !== decodedToken.id) {
      return res.status(403).json({ error: 'Forbidden: not blog owner' });
    }

    await blog.destroy();
    res.status(204).end();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalid or missing' });
  }
});

// USERS

// POST new user
app.post('/api/users', async (req, res, next) => {
  try {
    const { name, username, password } = req.body;

    // Validate presence of password if you want (optional here)
    if (!password || password.length < 3) {
      return res.status(400).json({ error: 'Password must be at least 3 characters long' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, username, passwordHash });
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

// GET all users with their blogs
app.get('/api/users', async (req, res) => {
  const users = await User.findAll({
    include: {
      model: Blog,
      attributes: ['id', 'title', 'author', 'url', 'likes'],
    },
  });
  res.json(users);
});

// PUT update username by username param
app.put('/api/users/:username', async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { username: req.params.username } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.username = req.body.username;
    await user.save();
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ where: { username } });
  const passwordCorrect = user
    ? await bcrypt.compare(password || '', user.passwordHash)
    : false;

  if (!(user && passwordCorrect)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const userForToken = {
    username: user.username,
    id: user.id,
  };

  const token = jwt.sign(userForToken, process.env.SECRET);
  res.json({ token, username: user.username, name: user.name });
});

// ERROR HANDLING MIDDLEWARE
app.use((err, req, res, next) => {
  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: err.errors.map(e => e.message),
    });
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// START SERVER
const PORT = process.env.PORT || 3001;

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Sync models with database, alters tables if needed
    await sequelize.sync({ alter: true });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to db:', err);
  }
};

start();
