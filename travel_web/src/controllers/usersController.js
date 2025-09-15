import db from '../db.js'; // your existing db connection

export const getUsers = async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};
