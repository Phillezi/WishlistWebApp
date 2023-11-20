const updateUIEnabled = true;

async function updateWishlist() {
    const token = getAuthToken();
    if (token === null || token === '') {
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
                wishlistItemsElement.appendChild(itemdiv);
            });
        } else {
            alert(data.error || data.message);
        }
    }

}

async function addItem() {
    const itemName = document.getElementById('item-name').value;
    const itemUrl = document.getElementById('item-url').value;
    const itemDesc = document.getElementById('item-description').value;
    const token = getAuthToken();
    if (token === null || token === '') {
        alert('Not logged in');
    } else {
        const response = await fetch('/api/item/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: token,
            },
            body: JSON.stringify({ itemName, itemUrl, itemDesc }),
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

async function getShareURL() {
    const token = getAuthToken();
    if (token === null || token === '') {
        alert('Not logged in');
    } else {
        const response = await fetch('/api/url/get', {
            headers: {
                Authorization: token,
            },
        });
        if (response.ok) {
            const data = await response.json();
            console.log(data.urlext);
        } else {
            alert(data.error || data.message);
        }
    }
}