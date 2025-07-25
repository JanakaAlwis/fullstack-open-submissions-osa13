const { Model, DataTypes } = require('sequelize')
const sequelize = require('../utils/db')

class Session extends Model {}

Session.init(
  {
    token: {
      type: DataTypes.STRING,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'session',
    underscored: true,
    timestamps: true
  }
)

module.exports = Session
