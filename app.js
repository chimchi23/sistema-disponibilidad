const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const db = new sqlite3.Database('./database.db');

// Configuración de EJS como motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware para procesar datos de formularios
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Crear la tabla de usuarios si no existe
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT DEFAULT 'user'
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS disponibilidad (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            sabado INTEGER DEFAULT 0,
            domingo INTEGER DEFAULT 0,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    `);
});

// Ruta principal
app.get('/', (req, res) => {
    res.render('index');
});

// Ruta para el registro de usuarios
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], (err) => {
        if (err) {
            return res.send('Error al registrar el usuario');
        }
        res.redirect('/');
    });
});

// Ruta para el login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
        if (err || !row) {
            return res.send('Usuario o contraseña incorrectos');
        }
        res.redirect('/dashboard');
    });
});

// Ruta para el dashboard del admin
app.get('/dashboard', (req, res) => {
    db.all('SELECT * FROM users', (err, rows) => {
        if (err) {
            return res.send('Error al obtener los usuarios');
        }
        res.render('dashboard', { users: rows });
    });
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
