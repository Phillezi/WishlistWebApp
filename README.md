# Wishlist App
This is a simple web application designed to facilitate the sharing and claiming of wishlists among users.

## Features
- **Gift Claiming:** Other users can claim items from wishlists, ensuring no duplicate gifts.
- **Summarized Gift List:** Get a summarized list of claimed gifts for easy management and tracking.

## Technologies Used
- **Node.js:** The server-side runtime environment for building fast and scalable applications.
- **MySQL Database:** A relational database management system to store and retrieve wishlist and user data.
- **Express.js:** A minimal and flexible Node.js web application framework.
- **jsonwebtoken:** For creating and verifying JSON Web Tokens (JWT) for user authentication.
- **bcrypt:** A library for hashing passwords for secure storage.
- **mysql2:** A Node.js-based MySQL library for interacting with the database.

## Getting Started

### Prerequisites
- Node.js installed on your machine
- MySQL database server

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Phillezi/WishlistWebApp.git
   ```

2. Install dependencies:
   ```bash
   cd WishlistWebApp/src
   npm install
   ```

3. Configure the database:
   - Update database connection details in `src/config/db.js`.
   
4. Configure the jwt secret:
   - Update the jwt secret in `src/config/secret.js`.

5. Start the application:
   ```bash
   npm start
   ```

5. Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration
Modify the configuration files in `src/config` to your database connections, and jwt token secret.

## License
This project is licensed under the [MIT License](LICENSE).

Happy wishing and gifting! 🎁
