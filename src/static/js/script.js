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
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('wishlist').style.display = 'block';
        document.getElementById('logout-button').style.display = 'block';
        // Implement the logic to display and update the user's wishlist
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
        // Implement the logic to display and update the user's wishlist
        updateWishlist();
    } else {
        alert(data.error || data.message);
    }
}

async function updateWishlist() {
    const token = getAuthToken();
    if (token === NULL || token === '') {
        alert('Not logged in');
    } else {
        const response = await fetch('/api/wishlist/get', {
            headers: {
                Authorization: token,
            },
        });

        const data = await response.json();

        if (response.ok) {
            const wishlistItems = data.wishlist;
            const wishlistItemsElement = document.getElementById('wishlist-items');
            wishlistItemsElement.innerHTML = '';

            wishlistItems.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item.item_name;
                wishlistItemsElement.appendChild(li);
            });
        } else {
            alert(data.error || data.message);
        }
    }

}

async function addItem() {
    const itemName = document.getElementById('item-name').value;
    const token = getAuthToken();
    if (token === NULL || token === '') {
        alert('Not logged in');
    } else {
        const response = await fetch('/api/item/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: token,
            },
            body: JSON.stringify({ itemName }),
        });

        const data = await response.json();

        if (response.ok) {
            // Update the displayed wishlist
            updateWishlist();
        } else {
            alert(data.error || data.message);
        }
    }
}

function logout() {
    localStorage.removeItem('token');
}

function getAuthToken() {
    const token = localStorage.getItem('token');
    return token;
}

function loginUi() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('wishlist').style.display = 'block';
    document.getElementById('logout-button').style.display = 'block';
}