require('dotenv').config()
const { Sequelize } = require('sequelize')

const sequelize = new Sequelize(process.env.DATABASE_URL)

const main = async () => {
  try {
    await sequelize.authenticate()
    console.log('Connected to database')
    await sequelize.close()
  } catch (error) {
    console.error('Database connection failed:', error)
  }
}

main()
