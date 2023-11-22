async function validateToken() {
    const token = getAuthToken();
    if (token === null || token === '') {
        logoutUi();
    } else {
        const response = await fetch('/api/token/verify', {
            headers: {
                Authorization: token,
            },
        });
        const data = await response.json();
        if (response.ok) {
            loginUi();
            updateWishlist();
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

function validateUsername(input) {
    var value = input.value;
    if (/\s/.test(value)) {
        input.value = value.replace(/\s/g, '');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    validateToken();
});