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

const base64UrlEncode = (str) => {
    return Buffer.from(str).toString('base64');
};

const base64UrlDecode = (str) => {
    return Buffer.from(str, 'base64').toString('utf-8');
};

const base64UrlDecodeToNumber = (str) => {
    const decodedString = base64UrlDecode(str);
    return Number(decodedString);
};

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
 * API endpoint to verify a token.
 */
app.get('/api/token/verify', (req, res) => {
    const userId = getUserIdFromAuthToken(req.headers.authorization);
    if (userId === null) {
        res.status(400).json({ message: 'Invalid token, try to login again' });
    } else {
        res.status(200).json({ message: 'Valid token' });
    }
});

/**
 * API endpoint to get url to share token.
 */
app.get('/api/url/get', (req, res) => {
    const userId = getUserIdFromAuthToken(req.headers.authorization);
    if (userId === null) {
        res.status(400).json({ message: 'Invalid token, try to login again' });
    } else {
        const encodedUserId = base64UrlEncode(String(userId));
        res.status(200).json({ 'urlext': encodedUserId });
    }
});


const serveWishlistHtml = (res, base64data) => {
    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <div id="token" style="display: none;">${base64data}</div>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Wishlist</title>
            <link rel="stylesheet" href="../css/styles.css">
        </head>
        <body>
        <div id="login-form">
            <h2>Login</h2>
            <label for="username">Username:</label>
            <input type="text" id="username" name="username" required>
            <label for="password">Password:</label>
            <input type="password" id="password" name="password" required>
            <button onclick="login()">Login</button>
        </div>

        <div id="register-form">
            <h2>Register</h2>
            <label for="register-username">Username:</label>
            <input type="text" id="register-username" name="register-username" required>
            <label for="register-password">Password:</label>
            <input type="password" id="register-password" name="register-password" required>
            <button onclick="register()">Register</button>
        </div>
        <div id="wishlist">
        <ul id="wishlist-items"></ul>
        </div>
        </body>
        <script src="../js/getlist.js"></script>
        <script src="../js/user.js"></script>
        </html>
    `;

    res.send(html);
};

/**
 * User list share link.
 */
app.get('/list/:encodedUserId', (req, res) => {
    const encodedUserId = req.params.encodedUserId;
    const userId = base64UrlDecodeToNumber(encodedUserId);

    if (userId === null || isNaN(userId)) {
        res.status(400).json({ message: 'Invalid user ID' });
    } else {
        serveWishlistHtml(res, encodedUserId);
    }
});

app.get('/api/wishlist/get/view', (req, res) => {
    const userId = base64UrlDecodeToNumber(req.headers.authorization);
    if (userId === null || isNaN(userId)) {
        res.status(400).json({ message: 'Invalid token' });
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
 * API endpoint to login a user.
 */
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    pool.query('SELECT user_id FROM users WHERE username = ? AND password = ?', [username, password], (err, results) => {
        if (err) {
            console.error('Error logging in:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const userId = results[0].user_id;
        const authToken = generateAuthToken(userId);
        res.json({ token: authToken });
    });


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
    if (userId === null) {
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
    const { itemName, itemUrl, itemDesc } = req.body;
    const userId = getUserIdFromAuthToken(req.headers.authorization);
    if (userId === null) {
        res.status(400).json({ message: 'Invalid token, try to login again' });
    }

    pool.query('INSERT INTO wishlist_items (user_id, item_name, item_url, item_desc) VALUES (?, ?, ?, ?)', [userId, itemName, itemUrl, itemDesc], (err, results) => {
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
    if (userId === null) {
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
    const { itemId, userToken } = req.body;
    const userId = base64UrlDecodeToNumber(userToken);
    if (userId === null || isNaN(userId)) {
        res.status(409).json({ error: 'Invalid user to claim from' });
    }
    const claimedUserId = getUserIdFromAuthToken(req.headers.authorization);
    if (claimedUserId === null) {
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
    if (claimedUserId === null) {
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