const sequelize = require('./utils/db');
const Blog = require('./models/blog');

const main = async () => {
  try {
    await sequelize.authenticate();
    console.log('Executing (default): SELECT * FROM blogs');

    const blogs = await Blog.findAll();

    blogs.forEach((blog) => {
      console.log(`${blog.author}: '${blog.title}', ${blog.likes} likes`);
    });

    await sequelize.close();
  } catch (err) {
    console.error('Error connecting to the database:', err);
  }
};

main();
