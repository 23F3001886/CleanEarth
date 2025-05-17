from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required, get_jwt
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import os

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-for-testing')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///cleanearth.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)
app.config['JWT_BLACKLIST_ENABLED'] = True  # Enable JWT blacklist
app.config['JWT_BLACKLIST_TOKEN_CHECKS'] = ['access']  # Check access tokens against blacklist

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)

# Initialize token blacklist set for storing revoked tokens
jwt_blacklist = set()

@jwt.token_in_blocklist_loader
def check_if_token_in_blacklist(jwt_header, jwt_payload):
    jti = jwt_payload["jti"]
    return jti in jwt_blacklist

# Simplify jwt error handling with standard decorators
# Note: Newer versions have @jwt.jwt_error_loader but we'll use what's compatible

# Add error handler for expired or invalid tokens
@jwt.invalid_token_loader
def invalid_token_callback(error):
    print(f"Invalid token error: {error}")
    return jsonify({
        'error': 'Invalid token',
        'message': str(error)
    }), 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({
        'error': 'Token has expired',
        'message': 'Please log in again'
    }), 401
    
@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({
        'error': 'Authorization required',
        'message': str(error)
    }), 401

@jwt.revoked_token_loader
def revoked_token_callback(jwt_header, jwt_payload):
    return jsonify({
        'error': 'Token has been revoked',
        'message': 'Please log in again'
    }), 401

# Enable CORS for all routes with specific settings
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Fix Flask route for the bare endpoint without /api/ prefix
@app.route('/request_register', methods=['POST', 'OPTIONS'])
def redirect_request_register():
    # Handle OPTIONS requests for CORS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', '*')
        response.headers.add('Access-Control-Allow-Methods', '*')
        return response
    # For POST requests, redirect to the proper API endpoint
    return register_request()

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), default='user')  # user, volunteer, admin
    address = db.Column(db.String(255))
    pincode = db.Column(db.String(10))
    latitude = db.Column(db.Float, default=0.0)
    longitude = db.Column(db.Float, default=0.0)
    is_blocked = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    requests = db.relationship('Request', backref='user', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'address': self.address,
            'pincode': self.pincode,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'is_blocked': self.is_blocked,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Request(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), nullable=False)
    pincode = db.Column(db.String(10), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=False)
    address = db.Column(db.String(255))
    link = db.Column(db.String(255))
    status = db.Column(db.String(20), default='pending')  # pending, in-progress, completed
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'pincode': self.pincode,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'description': self.description,
            'address': self.address,
            'link': self.link,
            'status': self.status,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Campaign(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    request_id = db.Column(db.Integer, db.ForeignKey('request.id'))
    date = db.Column(db.Date, nullable=False)
    num_volunteers = db.Column(db.Integer, default=0)
    timing = db.Column(db.String(50))
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default='planned')  # planned, in-progress, completed
    creator_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    # Completion details
    actual_participants = db.Column(db.Integer, default=0)
    waste_collected = db.Column(db.String(255))
    image_link = db.Column(db.String(255))
    completion_notes = db.Column(db.Text)
    completed_at = db.Column(db.DateTime)

    request = db.relationship('Request', backref='campaigns')
    creator = db.relationship('User')
    volunteers = db.relationship('CampaignVolunteer', backref='campaign', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'request_id': self.request_id,
            'date': self.date.isoformat() if self.date else None,
            'num_volunteers': self.num_volunteers,
            'timing': self.timing,
            'description': self.description,
            'status': self.status,
            'creator_id': self.creator_id,
            'volunteer_count': len(self.volunteers),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'actual_participants': self.actual_participants,
            'waste_collected': self.waste_collected,
            'image_link': self.image_link,
            'completion_notes': self.completion_notes,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'location': self.request.address if self.request else None
        }

class CampaignVolunteer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaign.id'))
    volunteer_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    status = db.Column(db.String(20), default='joined')  # joined, confirmed, declined
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    volunteer = db.relationship('User')
    
    def to_dict(self):
        return {
            'id': self.id,
            'campaign_id': self.campaign_id,
            'volunteer_id': self.volunteer_id,
            'volunteer_name': self.volunteer.name,
            'status': self.status,
            'joined_at': self.joined_at.isoformat() if self.joined_at else None
        }

class Badge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255))
    icon = db.Column(db.String(100))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='badges')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# Basic routes
@app.route('/')
def index():
    return jsonify({"message": "Welcome to CleanEarth API"})

# Authentication routes
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validate input
    if not data or not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Check if user already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "User already exists"}), 409
    
    # Create new user
    hashed_password = generate_password_hash(data['password'])
    user = User(
        name=data['name'],
        email=data['email'],
        password=hashed_password,
        address=data.get('address', ''),
        pincode=data.get('pincode', ''),
        latitude=data.get('latitude', 0.0),
        longitude=data.get('longitude', 0.0),
        role=data.get('role', 'user')
    )
    
    db.session.add(user)
    db.session.commit()
    
    # Create access token for immediate login after registration - ensure user_id is a string
    user_id_str = str(user.id)
    access_token = create_access_token(identity=user_id_str)
    
    print(f"Registration: Generated token for user {user_id_str}")
    
    return jsonify({
        "message": "User registered successfully",
        "user_id": user.id,
        "access_token": access_token,
        "user": user.to_dict()
    }), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Missing email or password"}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({"error": "Invalid credentials"}), 401
    
    # Check if user has specified role if provided
    if data.get('role') and user.role != data.get('role'):
        return jsonify({"error": f"User is not a {data.get('role')}"}), 403
    
    # Check if user is blocked
    if user.is_blocked:
        return jsonify({"error": "Your account has been blocked"}), 403
    
    # Create access token - ensure user_id is a string
    user_id_str = str(user.id)
    
    # Debugging output
    print(f"User ID type: {type(user_id_str)}, value: {user_id_str}")
    
    # Additional claims for the token
    additional_claims = {
        "user_email": user.email,
        "user_role": user.role
    }
    
    access_token = create_access_token(
        identity=user_id_str,
        additional_claims=additional_claims
    )
    
    print(f"Generated token for user {user_id_str}")
    
    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "user": user.to_dict()
    })

@app.route('/api/logout', methods=['POST'])
@jwt_required()
def logout():
    try:
        jti = get_jwt()["jti"]
        jwt_blacklist.add(jti)
        return jsonify({"message": "Successfully logged out"}), 200
    except Exception as e:
        print(f"Error in logout: {str(e)}")
        return jsonify({"error": "Failed to logout"}), 500

# Request management routes
@app.route('/api/request_register', methods=['POST'])
def register_request():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        print("Request data received:", data)
        
        # Find user by email instead of relying on JWT
        user = User.query.filter_by(email=data['email']).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        # Use user.id directly instead of the User object
        current_user_id = user.id
        
        # Validate required fields
        required_fields = ['email', 'pincode', 'latitude', 'longitude', 'description', 'address']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Type validation for numeric fields
        try:
            latitude = float(data['latitude'])
            longitude = float(data['longitude'])
        except ValueError:
            return jsonify({"error": "Latitude and longitude must be valid numbers"}), 422
        
        # Create and save the request
        new_request = Request(
            email=data['email'],
            pincode=data['pincode'],
            latitude=latitude,
            longitude=longitude,
            description=data['description'],
            address=data['address'],
            link=data.get('link', ''),  # Link is optional
            user_id=current_user_id,
            status='pending'
        )
        
        db.session.add(new_request)
        db.session.commit()
        
        return jsonify({
            "message": "Request created successfully", 
            "id": new_request.id,
            "request": new_request.to_dict()
        }), 201
        
    except Exception as e:
        # Rollback the session in case of error
        db.session.rollback()
        print(f"Error in request_register: {str(e)}")
        return jsonify({"error": f"Failed to process request: {str(e)}"}), 500

# Get all requests for a user
@app.route('/api/user_requests', methods=['GET'])
@jwt_required()
def get_user_requests():
    try:
        # Extract JWT token and print it for debugging
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        print(f"Token in user_requests: {token}")
        
        # Get user ID from JWT token with better error handling
        try:
            current_user_id = get_jwt_identity()
            print(f"User ID from token in user_requests: {current_user_id}")
        except Exception as e:
            print(f"JWT identity error in user_requests: {str(e)}")
            return jsonify({"error": "Invalid token"}), 401
            
        if not current_user_id:
            return jsonify({"error": "Invalid token - no user ID"}), 401
            
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        user_requests = Request.query.filter_by(user_id=current_user_id).all()
        return jsonify([r.to_dict() for r in user_requests])
    except Exception as e:
        print(f"Error in user_requests: {str(e)}")
        return jsonify({"error": "Failed to process request"}), 500

@app.route('/api/volunteer_requests', methods=['GET', 'OPTIONS'])
@jwt_required(optional=True)
def get_volunteer_requests():
    # Handle OPTIONS requests for CORS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
        return response
        
    try:
        # Extract JWT token and print it for debugging
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        print(f"Token: {token}")
        
        # Get user ID from JWT token with better error handling
        try:
            current_user_id = get_jwt_identity()
            print(f"User ID from token: {current_user_id}, type: {type(current_user_id)}")
            
            # Fix for "Subject must be a string" error - ensure user ID is a string
            if current_user_id is not None and not isinstance(current_user_id, str):
                current_user_id = str(current_user_id)
                print(f"Converted user ID to string: {current_user_id}")
                
        except Exception as e:
            print(f"JWT identity error: {str(e)}")
            return jsonify({"error": "Invalid token: " + str(e)}), 401
            
        if not current_user_id:
            return jsonify({"error": "Authentication required"}), 401
            
        current_user = User.query.get(current_user_id)
        if not current_user:
            return jsonify({"error": "User not found"}), 404
            
        # Allow both volunteers and admins to access
        if current_user.role not in ['volunteer', 'admin']:
            return jsonify({"error": "Not authorized"}), 403
            
        # Check if pincode exists
        if not current_user.pincode:
            return jsonify({"error": "No pincode associated with your account"}), 400
            
        volunteer_requests = Request.query.filter_by(pincode=current_user.pincode).all()
        return jsonify([r.to_dict() for r in volunteer_requests])
    except Exception as e:
        print(f"Error in volunteer_requests: {str(e)}")
        return jsonify({"error": "Failed to process request"}), 500

# Camp management routes
@app.route('/api/camp_register', methods=['POST'])
@jwt_required()
def register_camp():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Only volunteers and admins can create camps
    if current_user.role not in ['volunteer', 'admin']:
        return jsonify({"error": "Not authorized to create camps"}), 403
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['requestId', 'campName', 'dateOfCamp', 'timeOfCamp', 'numberOfVolunteers', 'description'
    ]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # Parse date
    try:
        campaign_date = datetime.strptime(data['dateOfCamp'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400
    
    new_campaign = Campaign(
        name=data['campName'],
        request_id=data['requestId'],
        date=campaign_date,
        num_volunteers=int(data['numberOfVolunteers']),
        timing=data['timeOfCamp'],
        description=data['description'],
        status='planned',
        creator_id=current_user_id
    )
    
    db.session.add(new_campaign)
    db.session.commit()
    
    return jsonify({
        "message": "Campaign created successfully", 
        "id": new_campaign.id,
        "campaign": new_campaign.to_dict()
    }), 201

# Campaign management routes
@app.route('/api/managecamp', methods=['GET', 'POST', 'PUT', 'DELETE'])
@jwt_required()
def manage_campaign():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # GET: Fetch single campaign or all campaigns
    if request.method == 'GET':
        camp_id = request.args.get('id')
        if camp_id:
            # Show single campaign
            campaign = Campaign.query.get_or_404(camp_id)
            return jsonify(campaign.to_dict())
        else:
            # List all campaigns
            campaigns = Campaign.query.all()
            return jsonify([c.to_dict() for c in campaigns])
    
    # POST: Create new campaign
    elif request.method == 'POST':
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['request_id', 'date', 'num_volunteers', 'timing', 'name']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Check if the request exists
        waste_request = Request.query.get(data['request_id'])
        if not waste_request:
            return jsonify({"error": "Referenced waste request does not exist"}), 400
        
        # Parse date
        try:
            campaign_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400
        
        new_campaign = Campaign(
            name=data['name'],
            request_id=data['request_id'],
            date=campaign_date,
            num_volunteers=int(data['num_volunteers']),
            timing=data['timing'],
            description=data.get('description', ''),
            status='planned',
            creator_id=current_user_id
        )
        
        db.session.add(new_campaign)
        db.session.commit()
        
        return jsonify({
            "message": "Campaign created successfully", 
            "id": new_campaign.id,
            "campaign": new_campaign.to_dict()
        }, 201)
    
    # PUT: Update campaign
    elif request.method == 'PUT':
        camp_id = request.args.get('id')
        if not camp_id:
            return jsonify({"error": "No campaign ID provided"}), 400
        
        campaign = Campaign.query.get_or_404(camp_id)
        
        # Check permissions (only creator or admin can update)
        if campaign.creator_id != current_user_id and current_user.role != 'admin':
            return jsonify({"error": "Not authorized to update this campaign"}), 403
        
        data = request.get_json()
        
        # Update fields if provided
        if 'name' in data:
            campaign.name = data['name']
        if 'request_id' in data:
            # Verify the request exists
            if not Request.query.get(data['request_id']):
                return jsonify({"error": "Referenced waste request does not exist"}), 400
            campaign.request_id = data['request_id']
        if 'date' in data:
            try:
                campaign.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400
        if 'num_volunteers' in data:
            campaign.num_volunteers = int(data['num_volunteers'])
        if 'timing' in data:
            campaign.timing = data['timing']
        if 'description' in data:
            campaign.description = data['description']
        if 'status' in data:
            campaign.status = data['status']
        
        db.session.commit()
        return jsonify({
            "message": "Campaign updated successfully",
            "campaign": campaign.to_dict()
        })
    
    # DELETE: Delete campaign
    elif request.method == 'DELETE':
        camp_id = request.args.get('id')
        if not camp_id:
            return jsonify({"error": "No campaign ID provided"}), 400
        
        campaign = Campaign.query.get_or_404(camp_id)
        
        # Check permissions (only creator or admin can delete)
        if campaign.creator_id != current_user_id and current_user.role != 'admin':
            return jsonify({"error": "Not authorized to delete this campaign"}), 403
        
        db.session.delete(campaign)
        db.session.commit()
        return jsonify({"message": "Campaign deleted successfully"})

# Campaign completion endpoint
@app.route('/api/complete-campaign/<int:campaign_id>', methods=['POST'])
@jwt_required()
def complete_campaign(campaign_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    campaign = Campaign.query.get_or_404(campaign_id)
    
    # Check if user is admin or campaign creator
    if current_user.role == 'admin' or current_user_id == campaign.creator_id:
        campaign.status = 'completed'
        db.session.commit()
        
        # Also update the associated request status
        if campaign.request:
            campaign.request.status = 'completed'
            db.session.commit()
            
        return jsonify({
            "message": "Campaign marked as completed",
            "campaign": campaign.to_dict()
        })
    
    return jsonify({"error": "Not authorized"}), 403

# Join campaign as a volunteer
@app.route('/api/join-campaign/<int:campaign_id>', methods=['POST'])
@jwt_required()
def join_campaign(campaign_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Check if user is a volunteer
    if current_user.role != 'volunteer':
        return jsonify({"error": "Only volunteers can join campaigns"}), 403
    
    campaign = Campaign.query.get_or_404(campaign_id)
    
    # Check if campaign is still open
    if campaign.status not in ['planned', 'in-progress']:
        return jsonify({"error": "Cannot join campaign that is not active"}), 400
    
    # Check if already joined
    existing = CampaignVolunteer.query.filter_by(
        campaign_id=campaign_id, 
        volunteer_id=current_user_id
    ).first()
    
    if existing:
        return jsonify({"error": "Already joined this campaign"}), 400
    
    # Join the campaign
    campaign_volunteer = CampaignVolunteer(
        campaign_id=campaign_id,
        volunteer_id=current_user_id,
        status='joined'
    )
    
    db.session.add(campaign_volunteer)
    db.session.commit()
    
    return jsonify({
        "message": "Successfully joined the campaign",
        "campaign": campaign.to_dict()
    })

# Leave campaign
@app.route('/api/leave-campaign/<int:campaign_id>', methods=['POST'])
@jwt_required()
def leave_campaign(campaign_id):
    current_user_id = get_jwt_identity()
    
    # Find the volunteer record
    volunteer_record = CampaignVolunteer.query.filter_by(
        campaign_id=campaign_id, 
        volunteer_id=current_user_id
    ).first_or_404()
    
    db.session.delete(volunteer_record)
    db.session.commit()
    
    return jsonify({"message": "Successfully left the campaign"})

# Get user profile
@app.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)
    
    return jsonify(user.to_dict())

# Update user profile
@app.route('/api/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)
    
    data = request.get_json()
    
    # Update allowed fields
    if 'name' in data:
        user.name = data['name']
    if 'address' in data:
        user.address = data['address']
    if 'pincode' in data:
        user.pincode = data['pincode']
    if 'latitude' in data:
        user.latitude = float(data['latitude'])
    if 'longitude' in data:
        user.longitude = float(data['longitude'])
        
    db.session.commit()
    
    return jsonify({
        "message": "Profile updated successfully",
        "user": user.to_dict()
    })

# Admin user management
@app.route('/api/admin/users', methods=['GET'])
@jwt_required()
def get_all_users():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Check if user is admin
    if current_user.role != 'admin':
        return jsonify({"error": "Not authorized"}), 403
    
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])

# Block/unblock user
@app.route('/api/admin/toggle_block/<int:user_id>', methods=['POST'])
@jwt_required()
def toggle_user_block(user_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Check if user is admin
    if current_user.role != 'admin':
        return jsonify({"error": "Not authorized"}), 403
    
    user = User.query.get_or_404(user_id)
    user.is_blocked = not user.is_blocked
    db.session.commit()
    
    return jsonify({
        "message": f"User {'blocked' if user.is_blocked else 'unblocked'} successfully",
        "user": user.to_dict()
    })

# Volunteer Leaderboard
@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    # Get top volunteers by camp participation
    volunteers = User.query.filter_by(role='volunteer').all()
    
    # Calculate volunteer stats
    leaderboard = []
    for volunteer in volunteers:
        participations = CampaignVolunteer.query.filter_by(volunteer_id=volunteer.id).all()
        completed_camps = [p for p in participations if Campaign.query.get(p.campaign_id).status == 'completed']
        
        # Calculate points (10 points per completed camp)
        points = len(completed_camps) * 10
        badges = Badge.query.filter_by(user_id=volunteer.id).count()
        
        leaderboard.append({
            "id": volunteer.id,
            "name": volunteer.name,
            "campsAttended": len(participations),
            "campsCompleted": len(completed_camps),
            "points": points,
            "badges": badges
        })
    
    # Sort by points (descending)
    leaderboard.sort(key=lambda x: x["points"], reverse=True)
    
    return jsonify(leaderboard)

# Badge management
@app.route('/api/badges', methods=['GET', 'OPTIONS'])
@jwt_required(optional=True)
def get_user_badges():
    # Handle OPTIONS requests for CORS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
        return response
        
    try:
        # Extract JWT token and print it for debugging
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        print(f"Token in badges: {token}")
        
        # Get user ID from JWT token with better error handling
        try:
            current_user_id = get_jwt_identity()
            print(f"User ID from token in badges: {current_user_id}")
        except Exception as e:
            print(f"JWT identity error in badges: {str(e)}")
            return jsonify({"error": "Invalid token: " + str(e)}), 401
            
        if not current_user_id:
            return jsonify({"error": "Invalid token - no user ID"}), 401
            
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        badges = Badge.query.filter_by(user_id=current_user_id).all()
        return jsonify([b.to_dict() for b in badges])
    except Exception as e:
        print(f"Error in badges: {str(e)}")
        return jsonify({"error": "Failed to process request"}), 500

# Admin award badge to user
@app.route('/api/admin/award_badge', methods=['POST'])
@jwt_required()
def award_badge():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Check if user is admin
    if current_user.role != 'admin':
        return jsonify({"error": "Not authorized"}), 403
    
    data = request.get_json()
    
    if not data or not data.get('user_id') or not data.get('name'):
        return jsonify({"error": "Missing required fields"}), 400
    
    user = User.query.get_or_404(data['user_id'])
    
    badge = Badge(
        name=data['name'],
        description=data.get('description', ''),
        icon=data.get('icon', '🏆'),
        user_id=user.id
    )
    
    db.session.add(badge)
    db.session.commit()
    
    return jsonify({
        "message": "Badge awarded successfully",
        "badge": badge.to_dict()
    })

@app.route('/api/user_camps', methods=['GET'])
@jwt_required()
def get_user_camps():
    try:
        # Extract JWT token and print it for debugging
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        print(f"Token in user_camps: {token}")
        
        # Get user ID from JWT token with better error handling
        try:
            current_user_id = get_jwt_identity()
            print(f"User ID from token in user_camps: {current_user_id}")
        except Exception as e:
            print(f"JWT identity error in user_camps: {str(e)}")
            return jsonify({"error": "Invalid token"}), 401
            
        if not current_user_id:
            return jsonify({"error": "Invalid token - no user ID"}), 401
            
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        # Check if pincode exists
        if not user.pincode:
            return jsonify({"error": "No pincode associated with your account"}), 400
            
        # Show all active camps in user's pincode
        camps = Campaign.query.filter_by(status='planned').join(Request, Campaign.request_id == Request.id).filter(Request.pincode == user.pincode).all()
        
        # Get current user's participation status in each camp
        camp_details = []
        for camp in camps:
            participation = CampaignVolunteer.query.filter_by(
                campaign_id=camp.id,
                volunteer_id=current_user_id
            ).first()
            
            camp_data = camp.to_dict()
            camp_data['isParticipating'] = bool(participation)
            camp_data['participationCount'] = CampaignVolunteer.query.filter_by(campaign_id=camp.id).count()
            camp_data['spotsLeft'] = max(0, camp.num_volunteers - camp_data['participationCount'])
            camp_details.append(camp_data)
            
        return jsonify(camp_details)
    except Exception as e:
        print(f"Error in user_camps: {str(e)}")
        return jsonify({"error": "Failed to process request"}), 500

@app.route('/api/volunteer_camps', methods=['GET', 'OPTIONS'])
@jwt_required(optional=True)
def get_volunteer_camps():
    # Handle OPTIONS requests for CORS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
        return response
        
    try:
        # Extract JWT token and print it for debugging
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        print(f"Token in volunteer_camps: {token}")
        
        # Get user ID from JWT token with better error handling
        try:
            current_user_id = get_jwt_identity()
            print(f"User ID from token in volunteer_camps: {current_user_id}")
        except Exception as e:
            print(f"JWT identity error in volunteer_camps: {str(e)}")
            return jsonify({"error": "Invalid token: " + str(e)}), 401
            
        if not current_user_id:
            return jsonify({"error": "Invalid token - no user ID"}), 401
            
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        if user.role not in ['volunteer', 'admin']:
            return jsonify({"error": "Not authorized"}), 403
            
        # Check if pincode exists
        if not user.pincode:
            return jsonify({"error": "No pincode associated with your account"}), 400
            
        # Show all active camps in volunteer's pincode
        camps = Campaign.query.filter_by(status='planned').join(Request, Campaign.request_id == Request.id).filter(Request.pincode == user.pincode).all()
        return jsonify([c.to_dict() for c in camps])
    except Exception as e:
        print(f"Error in volunteer_camps: {str(e)}")
        return jsonify({"error": "Failed to process request"}), 500

@app.route('/api/camp_participate/<int:camp_id>', methods=['POST'])
@jwt_required()
def participate_camp(camp_id):
    try:
        # Extract JWT token and print it for debugging
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        print(f"Token in camp_participate: {token}")
        
        # Get user ID from JWT token with better error handling
        try:
            current_user_id = get_jwt_identity()
            print(f"User ID from token in camp_participate: {current_user_id}")
        except Exception as e:
            print(f"JWT identity error in camp_participate: {str(e)}")
            return jsonify({"error": "Invalid token"}), 401
            
        if not current_user_id:
            return jsonify({"error": "Invalid token - no user ID"}), 401
            
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        camp = Campaign.query.get_or_404(camp_id)
        
        # Check if already joined
        from sqlalchemy import and_
        existing = CampaignVolunteer.query.filter(and_(
            CampaignVolunteer.campaign_id==camp_id, 
            CampaignVolunteer.volunteer_id==current_user_id
        )).first()
        
        if existing:
            return jsonify({"error": "Already participating in this camp"}), 400
            
        # Get current participant count
        current_participants = CampaignVolunteer.query.filter_by(campaign_id=camp_id).count()
        
        # Check if camp is full
        if current_participants >= camp.num_volunteers:
            return jsonify({"error": "This camp is already full"}), 400
        
        # Add participation
        participation = CampaignVolunteer(
            campaign_id=camp_id,
            volunteer_id=current_user_id,
            status='joined'
        )
        db.session.add(participation)
        db.session.commit()
        
        # Get updated counts
        new_count = CampaignVolunteer.query.filter_by(campaign_id=camp_id).count()
        spots_left = max(0, camp.num_volunteers - new_count)
        
        return jsonify({
            "message": "Successfully joined the campaign",
            "participationCount": new_count,
            "spotsLeft": spots_left,
            "campDetails": camp.to_dict()
        })
    
    except Exception as e:
        db.session.rollback()
        print(f"Error in camp_participate: {str(e)}")
        return jsonify({"error": f"Failed to process request: {str(e)}"}), 500

# Helper function to safely get user ID from JWT token
def get_safe_user_id():
    """Get user ID from JWT token, ensuring it's a string and handling errors"""
    try:
        user_id = get_jwt_identity()
        print(f"Raw user ID from token: {user_id}, type: {type(user_id)}")
        
        # Convert to string if not None
        if user_id is not None:
            if not isinstance(user_id, str):
                user_id = str(user_id)
                print(f"Converted user ID to string: {user_id}")
            return user_id
        else:
            print("Warning: JWT identity returned None")
            return None
    except Exception as e:
        print(f"Error getting JWT identity: {str(e)}")
        return None

# Add route to check authorization status and get user info
@app.route('/api/auth-check', methods=['GET', 'OPTIONS'])
@jwt_required(optional=True)
def auth_check():
    # Handle OPTIONS requests for CORS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        return response
    
    try:
        # Get raw token for debugging
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        print(f"Auth check token: {token}")
        
        if not token:
            return jsonify({
                "authenticated": False, 
                "error": "No token provided"
            }), 401
        
        try:
            current_user_id = get_jwt_identity()
            print(f"Auth check user ID: {current_user_id}")
        except Exception as e:
            print(f"JWT identity error in auth-check: {str(e)}")
            return jsonify({
                "authenticated": False,
                "error": f"Invalid token: {str(e)}"
            }), 401
        
        if not current_user_id:
            return jsonify({
                "authenticated": False,
                "error": "No user ID in token"
            }), 401
        
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({
                "authenticated": False,
                "error": "User not found"
            }), 404
            
        return jsonify({
            "authenticated": True,
            "user": user.to_dict()
        })
    except Exception as e:
        print(f"Auth check error: {str(e)}")
        return jsonify({
            "authenticated": False,
            "error": str(e)
        }), 401

# Get specific request details for camp registration
@app.route('/api/request/<int:request_id>', methods=['GET', 'OPTIONS'])
@jwt_required(optional=True)
def get_request_by_id(request_id):
    # Handle OPTIONS requests for CORS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        return response
        
    try:
        # Extract JWT token for debugging
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        print(f"Token in get_request_by_id: {token}")
        
        # Find the request
        waste_request = Request.query.get(request_id)
        if not waste_request:
            return jsonify({"error": "Request not found"}), 404
            
        # Return request details
        return jsonify(waste_request.to_dict())
    except Exception as e:
        print(f"Error in get_request_by_id: {str(e)}")
        return jsonify({"error": f"Failed to process request: {str(e)}"}), 500

@app.route('/api/complete-camp/<int:campaign_id>', methods=['POST'])
@jwt_required()
def complete_camp_with_details(campaign_id):
    try:
        # Get user identity and validate permissions
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            return jsonify({"error": "User not found"}), 404
            
        # Get the campaign
        campaign = Campaign.query.get_or_404(campaign_id)
        
        # Check if user is the creator of the camp or an admin
        if str(campaign.creator_id) != str(current_user_id) and current_user.role != 'admin':
            return jsonify({"error": "Not authorized to complete this campaign"}), 403
            
        # Get form data
        data = request.get_json()
        print("Completion data received:", data)
        
        # Validate required fields
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        # Update campaign with completion details
        if 'actual_participants' in data:
            campaign.actual_participants = int(data['actual_participants'])
        
        if 'waste_collected' in data:
            campaign.waste_collected = data['waste_collected']
            
        if 'image_link' in data:
            campaign.image_link = data['image_link']
            
        if 'completion_notes' in data:
            campaign.completion_notes = data['completion_notes']
            
        # Update status to completed and record completion time
        campaign.status = 'completed'
        campaign.completed_at = datetime.utcnow()
        
        # Update the associated request status to completed
        if campaign.request:
            campaign.request.status = 'completed'
            
        db.session.commit()
        
        # Return the updated campaign data
        return jsonify({
            "message": "Campaign marked as completed successfully",
            "campaign": campaign.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error completing campaign: {str(e)}")
        return jsonify({"error": f"Failed to complete campaign: {str(e)}"}), 500

if __name__ == '__main__':
    with app.app_context():
        # db.drop_all()
        db.create_all()
    app.run(debug=True)
