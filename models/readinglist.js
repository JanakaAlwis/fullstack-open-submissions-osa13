const { DataTypes } = require('sequelize')
const sequelize = require('../utils/db')

const ReadingList = sequelize.define('readinglist', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  blogId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'blogId'],
    },
  ],
})

module.exports = ReadingList
