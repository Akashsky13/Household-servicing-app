    
from flask import jsonify, render_template, render_template_string, request, send_file,send_from_directory, url_for
from flask_security import auth_required, current_user, roles_required, roles_accepted, SQLAlchemyUserDatastore
from flask_security.utils import hash_password, verify_password
from extentions import db
from models import Review, Service, ServiceRequest, ProfessionalServices,User,UserRoles
from datetime import datetime
from celery.result import AsyncResult
import os
from werkzeug.utils import secure_filename
from flask_mail import Message
from extentions import mail 
from tasks import export_closed_requests_to_csv,check_pending_requests_for_professionals # Assuming mail is initialized in app.py

def create_admin(app, user_datastore: SQLAlchemyUserDatastore):
    
    @app.route('/professional-reminder')
    def professional_reminder():
        task = check_pending_requests_for_professionals.delay()
        return jsonify({'task_id':task.id})
        

    @app.route('/start-export', methods=['GET'])
    def start_export():
        # Start the export task and return the task ID
        task = export_closed_requests_to_csv.delay()
        return jsonify({'task_id': task.id})

    @app.route('/check-task/<task_id>', methods=['GET'])
    def check_task_status(task_id):
        # Check the status of the Celery task
        task = AsyncResult(task_id)

        if task.state == 'SUCCESS':
            file_path = task.result
            filename = os.path.basename(file_path)
            download_url = url_for('download_csv', filename=filename, _external=True)
            return jsonify({'status': 'completed', 'download_url': download_url}), 200
        elif task.state == 'PENDING':
            return jsonify({'status': 'pending'}), 202
        else:
            return jsonify({'status': 'failed'}), 500

    @app.route('/download-file/<filename>', methods=['GET'])
    def download_csv(filename):
        # Download the generated CSV file
        file_path = os.path.join('./user-downloads', filename)
        if os.path.exists(file_path):
            return send_file(file_path, as_attachment=True)
        else:
            return jsonify({'error': 'File not found'}), 404

    @app.route('/api/services', methods=['GET'])
    def list_services():
        services = Service.query.all()
        return jsonify([{
            'id': service.id,
            'name': service.name,
            'price': service.price,
            'time_required': service.time_required,
            'description': service.description
        } for service in services]), 200

    # Add service
    @roles_required('admin')
    @app.route('/add-service', methods=['POST'])
    def add_service():
        data = request.get_json()
        new_service = Service(
            name=data.get('name'),
            price=data.get('price'),
            time_required=data.get('time_required'),
            description=data.get('description')
        )
        db.session.add(new_service)
        db.session.commit()
        return jsonify({'message': 'Service added successfully'}), 201
    
    @app.route('/services', methods=['GET'])
    def get_services_list():  
        services = Service.query.all()
        return jsonify([{
            'id': service.id,
            'name': service.name,
            'price': service.price,
            'time_required': service.time_required,
            'description': service.description
        } for service in services]), 200
   
    @roles_required('admin')
    @app.route('/update-service/<int:service_id>', methods=['PUT'])
    def update_service(service_id):
        service_data = request.get_json()
        service = Service.query.get(service_id) 
        if not service:
            return jsonify({'message': 'Service not found'}), 404

        # Updating service fields
        service.name = service_data['name']
        service.price = service_data['price']
        service.time_required = service_data['time_required']
        service.description = service_data['description']
        
        db.session.commit()  
        return jsonify({'message': 'Service updated successfully'}), 200

    @roles_required('admin')
    @app.route('/delete-service/<id>', methods=['DELETE'])
    def delete_service(id):
        service = Service.query.get(id)
        if not service:
            return jsonify({'message': 'Service not found'}), 404

        db.session.delete(service)
        db.session.commit()
        return jsonify({'message': 'Service deleted successfully'}), 200

    def send_activation_email(professional_email, full_name):
        msg = Message(
            "Account Activated",
            recipients=[professional_email]
        )
        msg.body = f"Dear {full_name},\n\nYour account has been activated. You can now log in and access your dashboard.\n\nThank you for choosing our platform."

        try:
            mail.send(msg)
            print(f"Activation email sent to {professional_email}")
        except Exception as e:
            print(f"Failed to send email: {e}")
            return jsonify({'message': 'Failed to send activation email'}), 500

    # route for Activating professional accounts
    @roles_required('admin')
    @app.route('/activate-prof/<id>', methods=['POST'])
    def activate_prof(id):
        user = user_datastore.find_user(id=id)
        if not user:
            return jsonify({'message': 'User not present'}), 404

        if user.active:
            return jsonify({'message': 'User already active'}), 400

        user.active = True
        db.session.commit()

        response = send_activation_email(user.email, user.full_name)
        if response:
            return response  

        return jsonify({'message': 'User is activated, activation email sent'}), 200

    # api to get all the inactive professionals
    @roles_required('admin')
    @app.route('/inactive_professional', methods=['GET'])
    def get_inactive_professionals():
        all_users = user_datastore.user_model.query.all()
        inactive_professional = [
            user for user in all_users
            if any(role.name == 'prof' for role in user.roles)
        ]
        results = [
            {
                'id': user.id,
                'email': user.email,
                'mobile': user.mobile,
                'location': user.location,
                'pincode': user.pincode,
                'service_type': user.service_type,
                'experience_years': user.experience_years,
                'documents': url_for('download_file', filename=os.path.basename(user.documents)) if user.documents else None,
                'blocked': user.blocked,
                'active': user.active
            }
            for user in inactive_professional
        ]

        return jsonify(results), 200

    # Get active customers
    @roles_required('admin')
    @app.route('/active_customers', methods=['GET'])
    def get_active_customers():
        all_users = user_datastore.user_model.query.all()

        active_customers = [
            user for user in all_users
            if user.active and any(role.name == 'cust' for role in user.roles)
        ]

        results = [
            {
                'id': user.id,
                'full_name': user.full_name,
                'email': user.email,
                'mobile': user.mobile,
                'location': user.location,
                'blocked': user.blocked 
            }
            for user in active_customers
        ]

        return jsonify(results), 200

    # Search for professionals
    @roles_required('admin')
    @app.route('/search_professionals', methods=['GET'])
    def search_professionals():
        email = request.args.get('email')
        location = request.args.get('location')
        blocked = request.args.get('blocked', type=lambda v: v.lower() in ('true', '1'))
        rating = request.args.get('rating', type=float)

        query = user_datastore.user_model.query
        professionals = query.filter(
            user_datastore.user_model.roles.any(name='prof')
        )

        if email:
            professionals = professionals.filter(user_datastore.user_model.email.ilike(f"%{email}%"))
        
        if location:
            professionals = professionals.filter(user_datastore.user_model.location.ilike(f"%{location}%"))
        
        if blocked is not None:
            professionals = professionals.filter(user_datastore.user_model.blocked == blocked)

        if rating is not None:
            professionals = professionals.join(Review, Review.professional_id == user_datastore.user_model.id).filter(Review.rating >= rating)

        results = [
            {
                'id': user.id,
                'email': user.email,
                'mobile': user.mobile,
                'location': user.location,
                'service_type': user.service_type,
                'experience_years': user.experience_years,
                'documents': url_for('download_file', filename=os.path.basename(user.documents)) if user.documents else None,
                'blocked': user.blocked,
                'active': user.active
            }
            for user in professionals.all()
        ]

        return jsonify(results), 200

    # Search for customers
    @roles_required('admin')
    @app.route('/search_customers', methods=['GET'])
    def search_customers():
        email = request.args.get('email')
        name = request.args.get('name')
        location = request.args.get('location')
        blocked = request.args.get('blocked', type=lambda v: v.lower() in ('true', '1'))

        query = user_datastore.user_model.query
        customers = query.filter(
            user_datastore.user_model.roles.any(name='cust')
        )

        if email:
            customers = customers.filter(user_datastore.user_model.email.ilike(f"%{email}%"))

        if name:
            customers = customers.filter(user_datastore.user_model.full_name.ilike(f"%{name}%"))
        
        if location:
            customers = customers.filter(user_datastore.user_model.location.ilike(f"%{location}%"))
        
        if blocked is not None:
            customers = customers.filter(user_datastore.user_model.blocked == blocked)

        results = [
            {
                'id': user.id,
                'full_name': user.full_name,
                'email': user.email,
                'mobile': user.mobile,
                'location': user.location,
                'blocked': user.blocked
            }
            for user in customers.all()
        ]

        return jsonify(results), 200

    # Block a user
    @roles_required('admin')
    @app.route('/block-user/<id>', methods=['POST'])
    def block_user(id):
        user = user_datastore.find_user(id=id)
        if not user:
            return jsonify({'message': 'User not found'}), 404

        user.blocked = True
        db.session.commit()
        return jsonify({'message': 'User has been blocked'}), 200

    # Unblock a user
    @roles_required('admin')
    @app.route('/unblock-user/<id>', methods=['POST'])
    def unblock_user(id):
        user = user_datastore.find_user(id=id)
        if not user:
            return jsonify({'message': 'User not found'}), 404

        user.blocked = False
        db.session.commit()
        return jsonify({'message': 'User has been unblocked'}), 200
    
    # api to show the statistics on admin dashboard
    @app.route('/api/statistics', methods=['GET'])
    @roles_required('admin')
    def get_statistics():
        try:
            total_active_professionals = User.query.filter_by(active=True).count()
            total_blocked_user = User.query.filter_by(blocked=True).count()
            total_customers = UserRoles.query.filter_by(role_id=3).count()  
            total_professionals = UserRoles.query.filter_by(role_id=2).count()  
            total_service_requests = ServiceRequest.query.count()
            average_rating = db.session.query(db.func.avg(Review.rating)).scalar() or 0
            status_data = {
                "Pending": ServiceRequest.query.filter_by(service_status='Pending').count(),
                "Accepted": ServiceRequest.query.filter_by(service_status='Accepted').count(),
                "Completed": ServiceRequest.query.filter_by(service_status='Completed').count(),
                "Canceled": ServiceRequest.query.filter_by(service_status='Canceled').count(),
            }

            return jsonify({
                "totalActiveProfessionals": total_active_professionals,
                "totalServiceRequests": total_service_requests,
                "totalBlockedUser": total_blocked_user,
                "totalCustomers": total_customers,
                "totalProfessionals": total_professionals,
                "averageRating": average_rating,
                "statusData": status_data
            }), 200

        except Exception as e:
            print(f"Error in get_statistics: {e}")
            import traceback
            print(traceback.format_exc())
            return jsonify({"error": "An error occurred while fetching statistics."}), 500
