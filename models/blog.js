const { DataTypes, Model } = require('sequelize');
const sequelize = require('../utils/db');

class Blog extends Model {}

Blog.init(
  {
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
  },
  {
    sequelize,
    modelName: 'blog',
    underscored: true,
    timestamps: false,
  }
);

module.exports = Blog;
