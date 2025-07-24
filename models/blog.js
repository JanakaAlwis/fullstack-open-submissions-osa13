const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const currentYear = new Date().getFullYear();

const Blog = sequelize.define('blog', {
  author: {
    type: DataTypes.STRING,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  likes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  year: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1991,
      max: currentYear,
    },
  },
}, {
  timestamps: true,
});

module.exports = Blog;
