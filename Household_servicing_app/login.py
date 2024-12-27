from flask import jsonify, render_template, render_template_string, request, send_file,send_from_directory, url_for
from flask_security import auth_required, current_user, roles_required, roles_accepted, SQLAlchemyUserDatastore,Security,login_user
from flask_security.utils import hash_password, verify_password
from extentions import db
from models import Service, ProfessionalServices,User
from datetime import datetime
from celery.result import AsyncResult
import os
from werkzeug.utils import secure_filename
from tasks import send_offers, send_reminders, send_customer_monthly_report

def create_view(app, user_datastore: SQLAlchemyUserDatastore, cache):
    @app.route('/test_send_monthly_report')
    def test_send_monthly_report():
        send_customer_monthly_report.delay()  # Call the task asynchronously
        return "Monthly report task has been triggered!"

    @app.route('/send-offers')
    def send_offers():
        task=send_offers.delay("Important Update", "Hello, we have an important announcement for you!")

        return jsonify({'task_id_for_mail' : task.id})
    @app.route('/reminder')
    def reminder():
        task=send_reminders.delay("We Miss You!", "It's been a while since you logged in. Come back and check out our latest services!")


        return jsonify({'task_id_for_mail' : task.id})
    

    @app.route('/get-csv/<task_id>')
    def get_csv(task_id):
        result = AsyncResult(task_id)

        if result.ready():
            return send_file('./user-downloads/file.csv')
        else:
            return jsonify({'state': result.state}), 202 

    @app.route('/cache-test')
    @cache.cached(timeout=5)
    def cache_test():
        return jsonify({"time": datetime.now()})
    
    @app.route('/')
    def home():
        return render_template('index.html')
    import logging

    logging.basicConfig(level=logging.DEBUG)


#login route

    @app.route('/user-login', methods=['POST'])
    def user_login():
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'message': 'Email or password is missing'}), 400

        user = user_datastore.find_user(email=email)

        if not user:
            logging.warning(f"Failed login attempt: User not found for email {email}")
            return jsonify({'message': 'User not found'}), 404

        if user.blocked:
            logging.warning(f"Failed login attempt: User account blocked for email {email}")
            return jsonify({'message': 'Your account is blocked'}), 403

        if not user.active:
            logging.info(f"User {user.email} attempted to log in while inactive.")
            return jsonify({
                'message': 'Your account is currently inactive. Please note that your documents are under verification. We appreciate your patience while we complete this process.'
            }), 403
        if verify_password(password, user.password):
            user.last_login = datetime.now()
            db.session.commit()
        
            logging.info(f"User {user.email} logged in successfully.")
            return jsonify({
                'token': user.get_auth_token(),
                'role': user.roles[0].name,
                'id': user.id,
                'email': user.email
            }), 200
        else:
            logging.warning(f"Failed login attempt: Incorrect password for email {email}")
            return jsonify({'message': 'Incorrect password'}), 401
    def allowed_file(filename):
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in ["zip"]
    

#Register route

    @app.route('/register', methods=['POST'])
    def register():
        data = request.form
        email = data.get('email')
        password = data.get('password')
        full_name = data.get('full_name')  
        role = data.get('role')
        location = data.get('location')
        pincode = data.get('pincode')
        mobile = data.get('mobile')
        service_type = data.get('service_type') 
        experience_years = data.get('experience_years') if role == 'prof' else None

        if not email or not password or not full_name or role not in ['prof', 'cust']:
            return jsonify({"message": "Invalid input"}), 400
        
        if user_datastore.find_user(email=email):
            return jsonify({"message": "User already exists"}), 409
        
        documents = request.files.get('documents')
        file_path = None
        if role == 'prof' and documents:
            if allowed_file(documents.filename):
                filename = secure_filename(documents.filename)
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                documents.save(file_path)
            else:
                return jsonify({"message": "Invalid file format, only ZIP allowed"}), 400

        active = role == 'cust'

        try:
            user = user_datastore.create_user(
                email=email,
                password=hash_password(password),
                full_name=full_name,
                roles=[role],
                active=active,
                location=location,
                pincode=pincode,
                mobile=mobile,
                service_type=service_type,  
                experience_years=experience_years,
                documents=file_path
            )
            db.session.commit() 
            if role == 'prof' and service_type:
                service = Service.query.filter_by(name=service_type).first()  
                if service:
                    professional_service = ProfessionalServices(
                        professional_id=user.id,
                        service_id=service.id  
                    )
                    db.session.add(professional_service)
                    db.session.commit()
                else:
                    return jsonify({"message": "Invalid service type provided"}), 400

            return jsonify({'message': 'User created successfully'}), 201

        except Exception as e:
            print(f"Error while creating user: {e}")
            db.session.rollback()
            return jsonify({'message': 'Error while creating user'}), 500
    


# Profile update
    @app.route('/api/user/update', methods=['PUT'])
    @auth_required('token')
    def update_user():
        if not current_user.is_authenticated:
            return jsonify({"error": "Unauthorized"}), 401  

        data = request.get_json()
        try:
            user = User.query.get(current_user.id) 
            if user:
                user.full_name = data.get('full_name', user.full_name)
                user.mobile = data.get('mobile', user.mobile)
                user.location = data.get('location', user.location)
                user.pincode = data.get('pincode', user.pincode)
                db.session.commit()  
                return jsonify({"message": "User profile updated successfully"}), 200
            return jsonify({"error": "User not found"}), 404 
        except Exception as e:
            print(f"Error updating user profile: {e}")
            db.session.rollback() 
            return jsonify({"error": "Error updating profile"}), 500

   

# User's profile data
    @app.route('/api/user/<int:user_id>', methods=['GET'])
    def get_user(user_id):
        user = User.query.get(user_id) 
        if user:
            return jsonify({
                "full_name": user.full_name,
                "email": user.email,
                "mobile": user.mobile,
                "location": user.location,
                "pincode": user.pincode,
            }), 200
        return jsonify({"error": "User not found"}), 404  
    @app.route('/download/<filename>')
    def download_file(filename):
        uploads = app.config['UPLOAD_FOLDER']
        return send_from_directory(uploads, filename, as_attachment=True)



