const updateUIEnabled = false;

async function updateWishlist() {
    const token = getShareToken();
    if (token === null || token === '') {
        alert('Not logged in');
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

                // Create a clickable button for each item
                const claimButton = document.createElement('button');
                claimButton.textContent = 'Claim';
                claimButton.addEventListener('click', () => {
                    claimItem(item.id);
                });
                itemdiv.appendChild(claimButton);

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
    if (token === null || token === '') {
        alert('You need to be logged in to claim items');
        return;
    }
    const response = await fetch('/api/item/claim', {
        headers: {
            Authorization: token,
        },
        body: {
            itemId,
            'userToken': getShareToken(),
        }
    });
    if (response.ok) {
        const data = await response.json();
    } else {
        alert(data.error || data.message);
    }

}

document.addEventListener('DOMContentLoaded', function() {
    updateWishlist();
});