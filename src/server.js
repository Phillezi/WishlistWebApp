const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const config = require('./config/db');
const secret = require('./config/secret');
const app = express();
const port = 3000;

const secretKey = secret.jwtkey;

const pool = mysql.createPool(config.mysql);

pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
    } else {
        console.log('Connected to MySQL database');
        connection.release();
    }
});

app.use(express.static('static'));
app.use(express.json());

function generateAuthToken(userId) {
    return jwt.sign({ userId }, secretKey, { expiresIn: '1h' });
}

function getUserIdFromAuthToken(token) {
    try {
        const decoded = jwt.verify(token, secretKey);
        return decoded.userId;
    } catch (error) {
        console.error('Error decoding JWT token:', error);
        return null;
    }
}

/**
 * API endpoint to login a user.
 */
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    pool.query('SELECT user_id FROM users WHERE username = ? AND password = ?', [username, password], (err, results) => {
        if (err) {
            console.error('Error logging in:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    const authToken = generateAuthToken(results[0].userId);
    res.json({ token: authToken });
});

/**
 * API endpoint to register a user.
 */
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;

    pool.query('SELECT user_id FROM users WHERE username = ?', [username], (err, checkResults) => {
        if (err) {
            console.error('Error when checking if username is free:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (checkResults.length === 0) {
            pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], (err, results) => {
                if (err) {
                    console.error('Error registering:', err);
                    return res.status(500).json({ error: 'Internal Server Error' });
                }
                const userId = results.insertId;
                const authToken = generateAuthToken(userId);
                res.json({ token: authToken });
            });
        } else {
            res.status(400).json({ message: 'Username already taken' });
        }
    });
});

/**
 * API endpoint to get the user's wishlist.
 */
app.get('/api/wishlist/get', (req, res) => {
    const userId = getUserIdFromAuthToken(req.headers.authorization);
    if (userId === NULL) {
        res.status(400).json({ message: 'Invalid token, try to login again' });
    }
    pool.query('SELECT * FROM wishlist_items WHERE user_id = ?', [userId], (err, results) => {
        if (err) {
            console.error('Error retrieving wishlist:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.status(200).json({ wishlist: results });
        }
    });
});

/**
 * API endpoint to add an item to the users wishlist.
 */
app.post('/api/item/add', (req, res) => {
    const { itemName } = req.body;
    const userId = getUserIdFromAuthToken(req.headers.authorization);
    if (userId === NULL) {
        res.status(400).json({ message: 'Invalid token, try to login again' });
    }

    pool.query('INSERT INTO wishlist_items (user_id, item_name) VALUES (?, ?)', [userId, itemName], (err, results) => {
        if (err) {
            console.error('Error adding item to wishlist:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.status(201).json({ message: 'Item added to wishlist successfully' });
        }
    });
});

/**
 * API endpoint to remove an item to the users wishlist.
 */
app.post('api/item/remove', (req, res) => {
    const { itemId } = req.body;
    const userId = getUserIdFromAuthToken(req.headers.authorization);
    if (userId === NULL) {
        res.status(400).json({ message: 'Invalid token, try to login again' });
    }

    pool.query('DELETE FROM wishlist_items WHERE id = ? AND user_id = ?', [itemId, userId], (err, results) => {
        if (err) {
            console.error('Error removing item from wishlist:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.status(200).json({ message: 'Item removed from wishlist successfully' });
        }
    });
});

/**
 * API endpoint to claim an item from a users wishlist.
 */
app.post('api/item/claim', (req, res) => {
    const { itemId, userId } = req.body;
    const claimedUserId = getUserIdFromAuthToken(req.headers.authorization);
    if (claimedUserId === NULL) {
        res.status(400).json({ message: 'Invalid token, try to login again' });
    }

    pool.query('UPDATE wishlist_items SET claimed_by = ? WHERE user_id = ? AND id = ? AND claimed_by IS NULL', [claimedUserId, userId, itemId], (err, results) => {
        if (err) {
            console.error('Error claiming item from wishlist:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else if (results.affectedRows === 0) {
            res.status(400).json({ error: 'Item not available for claiming' });
        } else {
            res.status(200).json({ message: 'Item claimed successfully' });
        }
    });
});

/**
 * API endpoint to unclaim an item from a users wishlist.
 */
app.post('api/item/unclaim', (req, res) => {
    const { itemId, userId } = req.body;
    const claimedUserId = getUserIdFromAuthToken(req.headers.authorization);
    if (claimedUserId === NULL) {
        res.status(400).json({ message: 'Invalid token, try to login again' });
    }

    pool.query('UPDATE wishlist_items SET claimed_by = NULL WHERE user_id = ? AND id = ? AND claimed_by IS ?', [userId, itemId, claimedUserId], (err, results) => {
        if (err) {
            console.error('Error unclaiming item from wishlist:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else if (results.affectedRows === 0) {
            res.status(400).json({ error: 'Item not available for unclaiming' });
        } else {
            res.status(200).json({ message: 'Item unclaimed successfully' });
        }
    });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});