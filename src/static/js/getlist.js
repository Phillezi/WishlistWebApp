async function updateWishlist() {
    const myToken = getAuthToken();
    let myId = null;
    if (myToken !== null || myToken !== '') {
        const response = await fetch('/api/token/id', {
            headers: {
                Authorization: myToken, // Use myToken here instead of token
            },
        });

        if (response.ok) {
            const data = await response.json();
            myId = data.userId;
        } else {
            console.error('Error fetching user ID:', response.status);
        }
    }
    const token = getShareToken();
    if (token === null || token === '') {
        alert('no token');
    } else {
        const response = await fetch('/api/wishlist/get/view', {
            headers: {
                Authorization: token,
            },
        });

        const data = await response.json();

        if (response.ok) {
            const wishlistItems = data.wishlist;
            const wishlistItemsElement = document.getElementById('wishlist-items');
            wishlistItemsElement.innerHTML = '';
            if (wishlistItems.length === 0) {
                wishlistItemsElement.innerHTML = 'No wishlist';
            }
            wishlistItems.forEach(item => {
                const itemdiv = document.createElement('div');
                itemdiv.classList.add('item');
                const name = document.createElement('li');
                name.textContent = item.item_name;
                itemdiv.appendChild(name);
                if (item.item_url) {
                    const url = document.createElement('li');

                    const icon = document.createElement('img');
                    icon.src = 'https://www.google.com/s2/favicons?domain=' + item.item_url;
                    icon.alt = 'Icon';
                    icon.style.width = '16px';
                    icon.style.height = '16px';

                    const link = document.createElement('a');
                    link.href = item.item_url;
                    link.textContent = item.item_url;

                    url.appendChild(icon);
                    url.appendChild(link);

                    itemdiv.appendChild(url);
                }
                if (item.item_desc) {
                    const description = document.createElement('li');
                    description.textContent = item.item_desc;
                    itemdiv.appendChild(description);
                }

                if (item.claimed_by == null) {
                    const claimButton = document.createElement('button');
                    claimButton.textContent = 'Claim';
                    claimButton.addEventListener('click', () => {
                        claimItem(item.id);
                    });
                    itemdiv.appendChild(claimButton);
                } else if (item.claimed_by === myId) {
                    const claimButton = document.createElement('button');
                    claimButton.classList.add('removebtn');
                    claimButton.textContent = 'Unclaim';
                    claimButton.addEventListener('click', () => {
                        unClaimItem(item.id);
                    });
                    itemdiv.appendChild(claimButton);
                }

                wishlistItemsElement.appendChild(itemdiv);
            });
        } else {
            alert(data.error || data.message);
        }
    }

}

function getShareToken() {
    return document.getElementById('token').innerHTML;
}

async function claimItem(itemId) {
    const token = getAuthToken();
    const b64id = getShareToken();
    if (token === null || token === '') {
        alert('You need to be logged in to claim items');
        return;
    }
    const response = await fetch('/api/item/claim', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: token,
        },
        body: JSON.stringify({ itemId, b64id }),
    });
    const data = await response.json();
    if (response.ok) {
        updateWishlist();
    } else {
        alert(data.error || data.message);
    }

}

async function unClaimItem(itemId) {
    const token = getAuthToken();
    const b64id = getShareToken();
    if (token === null || token === '') {
        alert('You need to be logged in to claim items');
        return;
    }
    const response = await fetch('/api/item/unclaim', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: token,
        },
        body: JSON.stringify({ itemId, b64id }),
    });
    const data = await response.json();
    if (response.ok) {
        updateWishlist();
    } else {
        alert(data.error || data.message);
    }

}

async function getUsername() {
    const b64id = getShareToken();
    const response = await fetch('/api/user/name/get', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ b64id }),
    });
    const data = await response.json();
    if (response.ok) {
        const text = data.name + 's wishlist';
        const usernameElement = document.getElementById('wishlistTitle');
        if (usernameElement) {
            // Set the retrieved username as the content of the HTML element
            usernameElement.textContent = text;
        } else {
            console.error('wishlistTitle element not found');
        }
    } else {
        alert(data.error || data.message);
    }
}

function loginUi() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('wishlist').style.display = 'block';
    document.getElementById('logout-button').style.display = 'block';
}

function logoutUi() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('logout-button').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function() {
    getUsername();
    updateWishlist();
});