# CleanEarth Backend

This is the backend server for the CleanEarth application. The server is built with Flask and provides the API endpoints needed by the frontend.

## Setup Instructions

1. Make sure Python 3.7+ is installed on your system
2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Start the server:
   ```
   python app.py
   ```

The server will run on `http://localhost:5000` by default.

## API Endpoints

The backend exposes the following API endpoints:

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login an existing user

### Request Management
- `GET /api/user_requests` - Get all requests for the current user
- `POST /api/request_register` - Create a new waste removal request

### Campaign Management
- `POST /api/camp_register` - Create a new cleanup campaign
- `POST /api/join-campaign/<campaign_id>` - Join an existing campaign

### Admin Operations
- `GET /api/admin/users` - Get all users (admin only)
- `POST /api/admin/toggle_block/<user_id>` - Block/unblock a user (admin only)
- `POST /api/admin/award_badge` - Award a badge to a user (admin only)

Check `app.py` for the full list of API endpoints and their requirements.

## Database

The application uses SQLite as the database, which is stored in `cleanearth.db`. The database will be created automatically when the server is first started.