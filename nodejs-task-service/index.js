const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// MySQL connection
const db = mysql.createPool({
  host: 'mysql',
  user: 'root',
  password: '672002',
  database: 'todo_db',
  port: 3306
});

// Simple test route
app.get('/', (req, res) => {
  res.send('Task Service is running');
});

app.listen(PORT, () => {
  console.log(`Task Service running on port ${PORT}`);
});

// Get all tasks
app.get('/api/tasks', (req, res) => {
    db.query('SELECT * FROM tasks', (err, results) => {
      if (err) return res.status(500).send(err);
      res.json(results);
    });
  });
  
  
  // Get task by ID
  app.get('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM tasks WHERE id = ?', [id], (err, results) => {
      if (err) return res.status(500).send(err);
      if (!results.length) return res.status(404).send('Task not found');
      res.json(results[0]);
    });
  });
  
  // Create a new task
  app.post('/api/tasks', (req, res) => {
    const { title, description, user_id, status } = req.body;
    db.query(
      'INSERT INTO tasks (title, description, user_id, status) VALUES (?, ?, ?, ?)',
      [title, description, user_id, status || 'pending'],
      (err, results) => {
        if (err) return res.status(500).send(err);
        res.json({ id: results.insertId, title, description, user_id, status: status || 'pending' });
      }
    );
  });
  
  // Update a task
  app.put('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const { title, description, user_id, status } = req.body;
    db.query(
      'UPDATE tasks SET title = ?, description = ?, user_id = ?, status = ? WHERE id = ?',
      [title, description, user_id, status, id],
      (err) => {
        if (err) return res.status(500).send(err);
        res.json({ id, title, description, user_id, status });
      }
    );
  });
  
  // Delete a task
  app.delete('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM tasks WHERE id = ?', [id], (err) => {
      if (err) return res.status(500).send(err);
      res.sendStatus(204);
    });
  });
  
