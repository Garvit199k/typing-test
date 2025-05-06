# Typing Test Application

A comprehensive typing test application with user management, analytics, and gaming features.

## Features

- User Registration and Login
- Secure Password Management
- User Profile Management
- Typing Test with WPM and Accuracy Tracking
- Global Leaderboards
- Achievement System and Badges
- Custom Themes (Dark/Light Mode)
- Analytics Dashboard
- Dog Rescue Game
- Persistent Test History

## Technologies Used

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express.js
- Database: MongoDB Atlas
- Authentication: JWT, bcrypt
- Other: Express Validator, CORS

## Developers

This project has been developed by Garvit and Karan, currently pursuing a Bachelor of Computer Applications (BCA) from Soban Singh Jeena University (SSJU), Almora. The project reflects our academic learning, technical skills, and collaborative efforts as part of our ongoing semester coursework.

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a .env file with the following variables:
   ```
   MONGODB_URI=your_mongodb_atlas_uri
   JWT_SECRET=your_jwt_secret
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open `index.html` in your browser

## Project Structure

- `/public` - Static files (HTML, CSS, JS)
- `/src` - Server-side code
  - `/models` - Database models
  - `/routes` - API routes
  - `/controllers` - Route controllers
  - `/middleware` - Custom middleware
  - `/config` - Configuration files 