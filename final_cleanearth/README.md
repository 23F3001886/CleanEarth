# CleanEarth

CleanEarth is a web application designed to help communities organize and manage waste cleanup campaigns.

## Project Structure

- **Frontend/** - React application
- **Backend/** - Flask API server

## Setup Instructions

### Prerequisites

- Node.js (v14 or newer)
- Python 3.7+
- npm or yarn

### Backend Setup

1. Navigate to the Backend folder:
   ```
   cd Backend
   ```

2. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Start the Flask server:
   ```
   python app.py
   ```

The backend server will run on http://localhost:5000

### Frontend Setup

1. Navigate to the Frontend folder:
   ```
   cd Frontend
   ```

2. Install Node.js dependencies:
   ```
   npm install
   ```
   or with yarn:
   ```
   yarn install
   ```

3. Start the development server:
   ```
   npm start
   ```
   or with yarn:
   ```
   yarn start
   ```

The frontend development server will run on http://localhost:3000

### Quick Start

For Windows users, we've included a `start.bat` script that will start both the backend and frontend servers:

```
start.bat
```

## Features

- User Authentication (register, login)
- Report waste locations that need cleanup
- Create and join cleanup campaigns
- Admin dashboard for content moderation
- Volunteer leaderboard to track community contributions
- Badge system to reward active participants

## User Roles

- **User**: Can report waste locations and view campaigns
- **Volunteer**: Can create and join cleanup campaigns
- **Admin**: Has full access to manage users, campaigns, and award badges

## License

This project is licensed under the MIT License.