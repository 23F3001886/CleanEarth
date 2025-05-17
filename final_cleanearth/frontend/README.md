# CleanEarth Frontend

This is the frontend for the CleanEarth application built with React.

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure API Connection:
   - Make sure the CleanEarth backend is running on http://localhost:5000
   - The API connection is configured in `src/services/api.js`

3. Start the development server:
   ```bash
   npm start
   ```

## API Connection Troubleshooting

If you experience 404 errors when connecting to the API:

1. Make sure the backend server is running on http://localhost:5000
2. Check browser console for CORS errors
3. Verify that the API endpoints in the code match those defined in the backend

## Authentication Flow

1. Registration:
   - New users can register at `/register`
   - After successful registration, users are automatically logged in

2. Login:
   - Users can login at `/login`
   - Different dashboards are shown based on user role

## Available Routes

- `/` - Home page (requires authentication)
- `/register` - User registration (public)
- `/login` - User login (public)
- `/report` - Submit waste report (requires authentication)
- `/volunteer` - Volunteer dashboard (requires volunteer role)
- `/admin` - Admin dashboard (requires admin role)
- `/camp-register` - Create cleanup camp (requires volunteer or admin role)
- `/about` - About page (public)
