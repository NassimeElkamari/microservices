const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const PORT = 3000;

const client = require('prom-client');

// collecte des métriques par défaut (CPU, mémoire, etc.)
client.collectDefaultMetrics();

// endpoint /metrics pour Prometheus
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '672002',
  database: process.env.DB_NAME || 'todo_db',
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
  
