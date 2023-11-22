const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
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

const saltRounds = 10; // The higher the number, the more secure, but also slower

async function hashPassword(password) {
    try {
        const salt = await bcrypt.genSalt(saltRounds);
        const hash = await bcrypt.hash(password, salt);
        return hash;
    } catch (error) {
        throw error;
    }
}

async function comparePassword(plainTextPassword, hashedPassword) {
    try {
        const match = await bcrypt.compare(plainTextPassword, hashedPassword);
        return match;
    } catch (error) {
        throw error;
    }
}

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
        if (error === jwt.TokenExpiredError) {
            return null;
        }
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
 * API endpoint to get id from token.
 */
app.get('/api/token/id', (req, res) => {
    const userId = getUserIdFromAuthToken(req.headers.authorization);
    if (userId === null) {
        res.status(400).json({ message: 'Invalid token, try to login again' });
    } else {
        res.status(200).json({ message: 'Valid token', userId });
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
            <link rel="apple-touch-icon" sizes="180x180" href="../icons/apple-touch-icon.png">
            <link rel="icon" type="image/png" sizes="32x32" href="../icons/favicon-32x32.png">
            <link rel="icon" type="image/png" sizes="16x16" href="../icons/favicon-16x16.png">
            <title>Wishlist</title>
            <link rel="stylesheet" href="../css/styles.css">
        </head>
        <body>
        <header></header>
        <div id="container">
            <h2 id="wishlistTitle"></h2>
            <section id="account-management">
                <div id="login-form">
                    <h2>Login</h2>
                    <label for="username">Username:</label>
                    <input type="text" id="username" name="username" required oninput="validateUsername(this)">
                    <label for="password">Password:</label>
                    <input type="password" id="password" name="password" required oninput="validateUsername(this)">
                    <button onclick="login()">Login</button>
                </div>
                <div id="register-form">
                    <h2>Register</h2>
                    <label for="register-username">Username:</label>
                    <input type="text" id="register-username" name="register-username" required oninput="validateUsername(this)">
                    <label for="register-password">Password:</label>
                    <input type="password" id="register-password" name="register-password" required oninput="validateUsername(this)">
                    <button onclick="register()">Register</button>
                </div>
            </section>
            <div id="wishlist">
            <ul id="wishlist-items"></ul>
            </div>
        </div>
        </body>
        <script src="../js/getlist.js"></script>
        <script src="../js/user.js"></script>
        <script src="../js/headermenu.js"></script>
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
    const userId = getUserIdFromAuthToken(req.headers.authorization);
    const viewUserId = base64UrlDecodeToNumber(req.headers.viewuser);
    if (userId === null || isNaN(userId) || viewUserId === null || isNaN(viewUserId)) {
        res.status(400).json({ message: 'Invalid token' });
        return;
    }
    pool.query('SELECT * FROM wishlist_items WHERE user_id = ?', [viewUserId], (err, results) => {
        if (err) {
            console.error('Error retrieving wishlist:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            results.forEach(item => {
                if (item.claimed_by != null) {
                    if (item.claimed_by === userId) {
                        item.claimed_by = 'you';
                    } else {
                        item.claimed_by = true;
                    }
                }
            });
            res.status(200).json({ wishlist: results });
        }
    });
});

/**
 * API endpoint to login a user.
 */
app.post('/api/login', (req, res) => {
    var { username, password } = req.body;

    username = username.replace(/[\s\t\n]/g, '').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
    password = password.replace(/[\s\t\n]/g, '');

    try {
        pool.query('SELECT user_id, password FROM users WHERE username = ?', [username], async(err, results) => {
            if (err) {
                console.error('Error logging in:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            if (results.length === 0) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }
            if (await comparePassword(password, results[0].password)) {
                const userId = results[0].user_id;
                const authToken = generateAuthToken(userId);
                res.json({ token: authToken });
            } else {
                return res.status(401).json({ error: 'Invalid username or password' });
            }
        });
    } catch (error) {
        console.error('Error hashing password:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }

});

/**
 * API endpoint to register a user.
 */
app.post('/api/register', (req, res) => {
    var { username, password } = req.body;

    username = username.replace(/[\s\t\n]/g, '').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
    password = password.replace(/[\s\t\n]/g, '');

    pool.query('SELECT user_id FROM users WHERE username = ?', [username], async(err, checkResults) => {
        if (err) {
            console.error('Error when checking if username is free:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (checkResults.length === 0) {
            try {
                const hashedPass = await hashPassword(password);
                pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPass], (err, results) => {
                    if (err) {
                        console.error('Error registering:', err);
                        return res.status(500).json({ error: 'Internal Server Error' });
                    }
                    const userId = results.insertId;
                    const authToken = generateAuthToken(userId);
                    res.json({ token: authToken });
                });
            } catch (error) {
                console.error('Error hashing password:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
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
        return;
    }
    pool.query('SELECT id, item_name, item_url, item_desc FROM wishlist_items WHERE user_id = ?', [userId], (err, results) => {
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
        return;
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
app.post('/api/item/remove', (req, res) => {
    const { itemId } = req.body;
    const userId = getUserIdFromAuthToken(req.headers.authorization);
    if (userId === null) {
        res.status(400).json({ message: 'Invalid token, try to login again' });
        return;
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
 * API endpoint to get the username of the users sharelink.
 */
app.post('/api/user/name/get', (req, res) => {
    const { b64id } = req.body;
    const userId = base64UrlDecodeToNumber(b64id);
    if (userId === null || isNaN(userId)) {
        res.status(409).json({ error: 'Invalid user' });
        return;
    }

    pool.query('SELECT username FROM users WHERE user_id = ?', [userId], (err, results) => {
        if (err) {
            console.error('Error getting username:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.status(200).json({ name: results[0].username });
        }
    });
});

/**
 * API endpoint to get the users claimed items.
 */
app.get('/api/user/claimed', (req, res) => {
    const userId = getUserIdFromAuthToken(req.headers.authorization);
    if (userId === null) {
        res.status(400).json({ message: 'Invalid token, try to login again' });
        return;
    }
    pool.query('SELECT wi.item_name, wi.item_url, wi.item_desc, u.username FROM wishlist_items wi JOIN users u ON wi.user_id = u.user_id WHERE wi.claimed_by = ?', [userId], (err, results) => {
        if (err) {
            console.error('Error retrieving claimed by:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.status(200).json({ results });
        }
    });
});


/**
 * API endpoint to claim an item from a users wishlist.
 */
app.post('/api/item/claim', (req, res) => {
    const { itemId, b64id } = req.body;
    const userId = base64UrlDecodeToNumber(b64id);
    if (userId === null || isNaN(userId)) {
        res.status(409).json({ error: 'Invalid user to claim from' });
        return;
    }
    const claimedUserId = getUserIdFromAuthToken(req.headers.authorization);
    if (claimedUserId === null) {
        res.status(400).json({ message: 'Invalid token, try to login again' });
        return;
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
app.post('/api/item/unclaim', (req, res) => {
    const { itemId, b64id } = req.body;
    const userId = base64UrlDecodeToNumber(b64id);
    if (userId === null || isNaN(userId)) {
        res.status(409).json({ error: 'Invalid user to unclaim from' });
        return;
    }
    const claimedUserId = getUserIdFromAuthToken(req.headers.authorization);
    if (claimedUserId === null) {
        res.status(400).json({ message: 'Invalid token, try to login again' });
        return;
    }

    pool.query('UPDATE wishlist_items SET claimed_by = NULL WHERE user_id = ? AND id = ? AND claimed_by = ?', [userId, itemId, claimedUserId], (err, results) => {
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