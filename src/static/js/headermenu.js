function fillHeader() {
    const header = document.querySelector('header');

    if (header) {
        const navContainer = document.createElement('div');
        navContainer.classList.add('nav-container');

        const homeButton = document.createElement('button');
        homeButton.textContent = 'Home';
        homeButton.addEventListener('click', () => {
            window.location.href = '/';
        });
        navContainer.appendChild(homeButton);

        const userContainer = document.createElement('div');
        userContainer.classList.add('user-container');

        const userIcon = document.createElement('img');
        const currentURL = window.location.href.replace(/\/[^/]*$/, '/');
        if (currentURL === window.location.href) {
            userIcon.src = 'images/user.png';
        } else {
            userIcon.src = '../images/user.png';
        }
        userIcon.alt = 'User Icon';

        const viewItemsButton = document.createElement('button');
        viewItemsButton.textContent = 'View Claimed Items';
        viewItemsButton.addEventListener('click', onViewItemsClick);

        const logoutButton = document.createElement('button');
        logoutButton.textContent = 'Logout';
        logoutButton.addEventListener('click', logout);
        logoutButton.id = "logout-button";

        userContainer.appendChild(userIcon);
        userContainer.appendChild(viewItemsButton);
        userContainer.appendChild(logoutButton);

        header.appendChild(navContainer);
        header.appendChild(userContainer);
        userContainer.style.display = 'none';
    } else {
        console.error('Header element not found');
    }
}


async function onViewItemsClick() {
    try {
        const token = getAuthToken();

        if (token === null || token === '') {
            alert('You need to be logged in to view claimed items');
            return;
        }

        const response = await fetch('/api/user/claimed', {
            headers: {
                Authorization: token,
            },
        });

        if (response.ok) {
            const data = await response.json();
            const claimedItemsPopup = data.results.map(item => `Till ${item.username}: ${item.item_name}: ${item.item_url} ${item.item_desc}`).join('\n');
            alert(`Claimed Items:\n${claimedItemsPopup}`);
        } else {
            const errorData = await response.json();
            alert(errorData.error || errorData.message);
        }
    } catch (error) {
        console.error('Error fetching claimed items:', error);
        alert('An error occurred while fetching claimed items');
    }
}

function showUserContainer() {
    var userContainers = document.getElementsByClassName('user-container');
    userContainers.array.forEach(element => {
        element.style.display = 'flex';
    });
}

function hideUserContainer() {
    var userContainers = document.getElementsByClassName('user-container');
    userContainers.array.forEach(element => {
        element.style.display = 'none';
    });
}

window.addEventListener('load', fillHeader);