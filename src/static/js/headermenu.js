function fillHeader() {
    const header = document.querySelector('header');

    if (header) {
        const navContainer = document.createElement('div');
        navContainer.classList.add('nav-container');
        // Create a home button
        const homeButton = document.createElement('button');
        homeButton.textContent = 'Home';
        homeButton.addEventListener('click', () => {
            window.location.href = '/'; // Redirect to the home page
        });
        navContainer.appendChild(homeButton);

        const userContainer = document.createElement('div');
        userContainer.classList.add('user-container'); // You can add your own class for styling

        const userIcon = document.createElement('img');
        userIcon.src = 'path/to/user-icon.png'; // Set the path to your user icon
        userIcon.alt = 'User Icon';

        // Create a button to view claimed items
        const viewItemsButton = document.createElement('button');
        viewItemsButton.textContent = 'View Claimed Items';
        viewItemsButton.addEventListener('click', onViewItemsClick); // Define onViewItemsClick function

        // Create a logout button
        const logoutButton = document.createElement('button');
        logoutButton.textContent = 'Logout';
        logoutButton.addEventListener('click', logout); // Define onLogoutClick function
        logoutButton.id = "logout-button";
        logoutButton.style.display = "none";

        // Append elements to the user container
        userContainer.appendChild(userIcon);
        userContainer.appendChild(viewItemsButton);
        userContainer.appendChild(logoutButton);

        header.appendChild(navContainer);
        header.appendChild(userContainer);
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

async function getUsernameFromId(userId) {

}

window.addEventListener('load', fillHeader);