require('dotenv').config()
const express = require('express')
const { ValidationError } = require('sequelize')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { Op, fn, col } = require('sequelize')

const sequelize = require('./utils/db')
const Blog = require('./models/blog')
const User = require('./models/user')
const ReadingList = require('./models/readinglist')

const tokenExtractor = require('./utils/tokenExtractor')
const userExtractor = require('./utils/userExtractor')

const app = express()
app.use(express.json())

// -------------------- ASSOCIATIONS --------------------

User.hasMany(Blog)
Blog.belongsTo(User)

User.belongsToMany(Blog, { through: ReadingList, as: 'readings' })
Blog.belongsToMany(User, { through: ReadingList, as: 'usersMarked' })

// -------------------- BLOG ROUTES --------------------

app.get('/api/blogs', async (req, res) => {
  const where = req.query.search
    ? {
        [Op.or]: [
          { title: { [Op.iLike]: `%${req.query.search}%` } },
          { author: { [Op.iLike]: `%${req.query.search}%` } },
        ],
      }
    : {}

  const blogs = await Blog.findAll({
    where,
    order: [['likes', 'DESC']],
    include: {
      model: User,
      attributes: ['name', 'username'],
    },
  })

  res.json(blogs)
})

app.post('/api/blogs', tokenExtractor, async (req, res) => {
  try {
    const decodedToken = jwt.verify(req.token, process.env.SECRET)
    const user = await User.findByPk(decodedToken.id)
    if (!user) return res.status(401).json({ error: 'Invalid user' })

    const { title, url, author, likes } = req.body
    if (!title || !url) return res.status(400).json({ error: 'title and url required' })

    const blog = await Blog.create({
      title,
      url,
      author,
      likes: likes || 0,
      userId: user.id,
    })

    res.status(201).json(blog)
  } catch (err) {
    res.status(401).json({ error: 'token missing or invalid' })
  }
})

app.delete('/api/blogs/:id', tokenExtractor, async (req, res) => {
  try {
    const decodedToken = jwt.verify(req.token, process.env.SECRET)
    const blog = await Blog.findByPk(req.params.id)

    if (!blog) return res.status(404).json({ error: 'blog not found' })
    if (blog.userId !== decodedToken.id) return res.status(403).json({ error: 'not authorized' })

    await blog.destroy()
    res.status(204).end()
  } catch (err) {
    res.status(401).json({ error: 'token missing or invalid' })
  }
})

// -------------------- USER ROUTES --------------------

app.post('/api/users', async (req, res, next) => {
  try {
    const { username, name, password } = req.body
    if (!password || password.length < 3) {
      return res.status(400).json({ error: 'Password must be at least 3 characters long' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({ username, name, passwordHash })
    res.status(201).json(user)
  } catch (err) {
    next(err)
  }
})

app.get('/api/users', async (req, res) => {
  const users = await User.findAll({
    include: {
      model: Blog,
      attributes: ['id', 'title', 'author', 'url', 'likes'],
    },
  })
  res.json(users)
})

app.put('/api/users/:username', async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { username: req.params.username } })
    if (!user) return res.status(404).json({ error: 'User not found' })

    user.username = req.body.username
    await user.save()
    res.json(user)
  } catch (err) {
    next(err)
  }
})

app.get('/api/users/:id', async (req, res) => {
  const whereClause = req.query.read
    ? { read: req.query.read === 'true' }
    : {}

  const user = await User.findByPk(req.params.id, {
    attributes: ['username', 'name'],
    include: {
      model: Blog,
      as: 'readings',
      attributes: ['id', 'title', 'url', 'author', 'likes', 'year'],
      through: {
        attributes: ['read', 'id'],
        where: whereClause,
      },
    },
  })

  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json(user)
})

// -------------------- LOGIN --------------------

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body
  const user = await User.findOne({ where: { username } })

  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

  const token = jwt.sign({ id: user.id, username: user.username }, process.env.SECRET)
  res.json({ token, username: user.username, name: user.name })
})

// -------------------- AUTHORS SUMMARY --------------------

app.get('/api/authors', async (req, res) => {
  const authors = await Blog.findAll({
    attributes: [
      'author',
      [fn('COUNT', col('author')), 'articles'],
      [fn('SUM', col('likes')), 'likes'],
    ],
    group: ['author'],
    order: [[fn('SUM', col('likes')), 'DESC']],
  })

  res.json(
    authors.map((a) => ({
      author: a.author,
      articles: a.dataValues.articles,
      likes: a.dataValues.likes,
    }))
  )
})

// -------------------- READING LIST --------------------

app.post('/api/readinglists', async (req, res, next) => {
  try {
    const { userId, blogId } = req.body
    const reading = await ReadingList.create({ userId, blogId })
    res.status(201).json(reading)
  } catch (err) {
    next(err)
  }
})

app.put('/api/readinglists/:id', tokenExtractor, userExtractor, async (req, res, next) => {
  try {
    const reading = await ReadingList.findByPk(req.params.id)
    if (!reading) return res.status(404).json({ error: 'Reading list entry not found' })

    if (reading.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to update this reading list entry' })
    }

    reading.read = req.body.read
    await reading.save()
    res.json(reading)
  } catch (err) {
    next(err)
  }
})

// -------------------- ERROR HANDLER --------------------

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message)
  console.error(err.stack)

  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.errors.map((e) => e.message) })
  }

  res.status(500).json({ error: 'Internal server error' })
})

// -------------------- SERVER --------------------

module.exports = app

if (require.main === module) {
  const PORT = process.env.PORT || 3001
  const start = async () => {
    try {
      await sequelize.authenticate()
      console.log('Connected to database')
      await sequelize.sync()
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`)
      })
    } catch (err) {
      console.error('Failed to start server:', err)
    }
  }
  start()
}
