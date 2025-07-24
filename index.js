require('dotenv').config();
const express = require('express');
const app = express();
const sequelize = require('./utils/db');
const Blog = require('./models/blog');

app.use(express.json());

app.get('/api/blogs', async (req, res) => {
  const blogs = await Blog.findAll();
  res.json(blogs);
});

app.post('/api/blogs', async (req, res) => {
  console.log('Received body:', req.body);

  try {
    const blog = await Blog.create(req.body);
    console.log('Created blog:', blog.toJSON());
    res.status(201).json(blog);
  } catch (error) {
    console.error('Error creating blog:', error.message);
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/blogs/:id', async (req, res) => {
  const deleted = await Blog.destroy({ where: { id: req.params.id } });
  if (deleted) {
    res.status(204).end();
  } else {
    res.status(404).json({ error: 'Blog not found' });
  }
});

const PORT = process.env.PORT || 3001;

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to db:', err);
  }
};

start();
