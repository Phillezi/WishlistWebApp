async function validateToken() {
    const token = getAuthToken();
    if (token === null || token === '') {
        if (updateUIEnabled) {
            logoutUi();
        }
    } else {
        const response = await fetch('/api/token/verify', {
            headers: {
                Authorization: token,
            },
        });
        const data = await response.json();
        if (response.ok) {
            if (updateUIEnabled) {
                loginUi();
                updateWishlist();
            }
        } else {
            console.log('Token has timed out, please log in again');
            logout();
        }
    }
}


async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    const data = await response.json();


    if (response.ok) {
        localStorage.setItem('token', data.token);
        loginUi();
        updateWishlist();
    } else {
        alert(data.error || data.message);
    }
}

async function register() {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
        localStorage.setItem('token', data.token);
        loginUi();
        updateWishlist();
    } else {
        alert(data.error || data.message);
    }
}

function logout() {
    localStorage.removeItem('token');
    logoutUi();
}

function getAuthToken() {
    const token = localStorage.getItem('token');
    return token;
}

function loginUi() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('editSection').style.display = 'block';
    document.getElementById('logout-button').style.display = 'block';
}

function logoutUi() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('editSection').style.display = 'none';
    document.getElementById('logout-button').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function() {
    validateToken();
});