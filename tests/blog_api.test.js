const supertest = require('supertest');
const app = require('../index'); // Your Express app
const api = supertest(app);
const sequelize = require('../utils/db'); // Correct import (not destructured)

const Blog = require('../models/blog');
const User = require('../models/user');

beforeAll(async () => {
  await sequelize.sync({ force: true }); // Reset DB before tests
});

afterAll(async () => {
  await sequelize.close();
});

describe('Blog API exercises 13.13 - 13.16', () => {
  test('GET /api/blogs returns empty array initially', async () => {
    const response = await api.get('/api/blogs').expect(200);
    expect(response.body).toEqual([]);
  });

  test('Filtering blogs by search in title or author works', async () => {
    // Create test blogs
    await Blog.bulkCreate([
      { title: 'React patterns', author: 'Michael Chan', url: 'https://reactpatterns.com', likes: 7 },
      { title: 'Go To Statement Considered Harmful', author: 'Edsger W. Dijkstra', url: 'http://example.com', likes: 5 },
      { title: 'Canonical string reduction', author: 'Edsger W. Dijkstra', url: 'http://example.com', likes: 12 },
      { title: 'First class tests', author: 'Robert C. Martin', url: 'http://example.com', likes: 10 }
    ]);

    let res = await api.get('/api/blogs?search=react').expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title.toLowerCase()).toContain('react');

    res = await api.get('/api/blogs?search=edsger').expect(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].author.toLowerCase()).toContain('edsger');

    res = await api.get('/api/blogs').expect(200);
    expect(res.body.length).toBeGreaterThanOrEqual(4);
  });

  test('Blogs are returned ordered by likes descending', async () => {
    const res = await api.get('/api/blogs').expect(200);

    // Check descending order by likes
    for (let i = 0; i < res.body.length - 1; i++) {
      expect(res.body[i].likes).toBeGreaterThanOrEqual(res.body[i + 1].likes);
    }
  });

  test('GET /api/authors returns blog counts and total likes ordered by likes desc', async () => {
    const res = await api.get('/api/authors').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    // Check object keys and that ordering by likes desc works
    let previousLikes = Infinity;
    for (const author of res.body) {
      expect(author).toHaveProperty('author');
      expect(author).toHaveProperty('articles');
      expect(author).toHaveProperty('likes');

      expect(Number(author.likes)).toBeLessThanOrEqual(previousLikes);
      previousLikes = Number(author.likes);
    }
  });
});
