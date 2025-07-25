const { Model, DataTypes } = require('sequelize')
const sequelize = require('../utils/db')

class Blog extends Model {}

Blog.init({
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  author: {
    type: DataTypes.STRING,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  likes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  sequelize,
  modelName: 'blog',
})

module.exports = Blog
