from flask import jsonify, logging, render_template, render_template_string, request, send_from_directory, url_for
from flask_security import auth_required, current_user, roles_required, roles_accepted, SQLAlchemyUserDatastore, Security, login_user
from flask_security.utils import hash_password, verify_password
from extentions import db
from models import Service, ServiceRequest, ProfessionalServices, User, Review, UserRoles
from datetime import datetime
from celery.result import AsyncResult
import os
from werkzeug.utils import secure_filename
from flask_mail import Message

def create_cust(app, user_datastore: SQLAlchemyUserDatastore, cache):

    @roles_required('cust')
    @app.route('/active_professional', methods=['GET'])
    def get_active_professionals():
        all_users = user_datastore.user_model.query.all()

        location_search = request.args.get('location', '').strip().lower()
        service_search = request.args.get('service', '').strip().lower()

        active_professionals = [
            user for user in all_users if user.active and not user.blocked and any(role.name == 'prof' for role in user.roles)
        ]

        if location_search:
            active_professionals = [
                user for user in active_professionals if user.location and location_search in user.location.lower()
            ]
        
        if service_search:
            active_professionals = [
                user for user in active_professionals if user.service_type and service_search in user.service_type.lower()
            ]

        results = []
        for prof in active_professionals:
            services = [ps.service_id for ps in prof.professional_services]
            reviews = prof.reviews_received
            average_rating = calculate_average_rating(reviews)

            results.append({
                'id': prof.id,
                'full_name': prof.full_name,
                'email': prof.email,
                'mobile': prof.mobile,
                'location': prof.location,
                'pincode': prof.pincode,
                'service_type': prof.service_type,
                'experience_years': prof.experience_years,
                'blocked': prof.blocked,
                'active': prof.active,
                "service_ids": services,
                'average_rating': average_rating
            })

        results.sort(key=lambda x: x['average_rating'] if x['average_rating'] is not None else 0, reverse=True)

        return jsonify(results), 200

    def calculate_average_rating(reviews):
        if not reviews:
            return None
        total_rating = sum(review.rating for review in reviews)
        return total_rating / len(reviews)

    @app.route('/api/service_requests', methods=['POST'])
    @auth_required('token')
    def request_service():
        if not current_user.is_authenticated:
            return jsonify({"error": "Unauthorized"}), 401

        data = request.get_json()
        service_id = data.get('service_id')
        professional_id = data.get('professional_id')
        remarks = data.get('remarks')  

        if not service_id or not professional_id:
            return jsonify({"error": "Missing required fields: service_id and professional_id"}), 400

        try:
            service_request = ServiceRequest(
                service_id=service_id,
                customer_id=current_user.id,
                professional_id=professional_id,
                remarks=remarks or "No specific remarks provided"  
            )
            db.session.add(service_request)
            db.session.commit()
            return jsonify({'message': 'Service request submitted successfully!'}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/api/service_requests/complete/<int:request_id>', methods=['PATCH'])
    @auth_required('token')
    def complete_service_request(request_id):
        if not current_user.is_authenticated:
            return jsonify({"error": "Unauthorized"}), 401

        service_request = ServiceRequest.query.get_or_404(request_id)
        service_request.service_status = "Completed"
        
        review_text = request.json.get('remarks')
        rating = request.json.get('rating')

        if review_text and rating:
            new_review = Review(
                professional_id=service_request.professional_id,
                customer_id=current_user.id,
                rating=rating,
                review_text=review_text,
            )
            db.session.add(new_review)

        db.session.commit()
        return jsonify({"message": "Service request marked as completed."}), 200

    @app.route('/api/service_requests/cancel/<int:request_id>', methods=['PATCH'])
    @auth_required('token')
    def cancel_service_request(request_id):
        if not current_user.is_authenticated:
            return jsonify({"error": "Unauthorized"}), 401

        service_request = ServiceRequest.query.get_or_404(request_id)
        service_request.service_status = "Canceled"
        
        db.session.commit()
        return jsonify({"message": "Service request canceled successfully."}), 200

    @app.route('/api/service_requests/history', methods=['GET'])
    @auth_required('token')
    def get_service_request_history():
        if not current_user.is_authenticated:
            return jsonify({"error": "Unauthorized"}), 401

        service_requests = ServiceRequest.query.filter_by(customer_id=current_user.id).all()
        
        requests_history = [
            {
                'id': req.id,
                'professional': {
                    'id': req.professional.id,
                    'full_name': req.professional.full_name
                },
                'service': {
                    'id': req.service.id,
                    'name': req.service.name
                },
                'date_of_request': req.date_of_request,
                'service_status': req.service_status,
                'remarks': req.remarks
            }
            for req in service_requests
        ]

        return jsonify(requests_history), 200

    @app.route('/api/service_requests/<int:request_id>/review', methods=['POST'])
    @auth_required('token')
    @roles_required('cust')
    def submit_review(request_id):
        data = request.get_json()
        app.logger.debug(f"Received review data: {data}")

        rating = data.get('rating')
        review_text = data.get('review_text')

        if rating is None or review_text is None:
            return jsonify({'error': 'Rating and review_text are required.'}), 400

        try:
            rating = int(rating)
        except ValueError:
            return jsonify({'error': 'Rating must be a number between 1 and 5.'}), 400

        if not (1 <= rating <= 5):
            return jsonify({'error': 'Rating must be a number between 1 and 5.'}), 400

        try:
            app.logger.debug(f"Fetching service request with ID {request_id}")
            service_request = ServiceRequest.query.get(request_id)
            if not service_request:
                app.logger.debug(f"Service request with ID {request_id} not found.")
                return jsonify({'error': 'Service request not found.'}), 404

            app.logger.debug(f"Service request found: {service_request}")
            app.logger.debug(f"Current user ID: {current_user.id}")
            new_review = Review(
                professional_id=service_request.professional_id,
                customer_id=current_user.id,
                rating=rating,
                review_text=review_text
            )

            db.session.add(new_review)
            db.session.commit()

            return jsonify({'message': 'Review submitted successfully!'}), 201

        except Exception as e:
            app.logger.error(f"Error saving review for request {request_id} by user {current_user.id}: {str(e)}")
            return jsonify({'error': 'An error occurred while saving the review.'}), 500

    @app.route('/api/customer/statistics', methods=['GET'])
    @roles_required('cust')  # Ensure the user has the 'cust' role
    @auth_required('token')  # Ensure the user is authenticated with a valid token
    def get_customer_statistics():
        token = request.headers.get("Authentication-Token")
        
        # Extract customer ID from token
        customer_id = extract_customer_id_from_token(token)

        try:
            # Statistics calculations
            total_service_requests = ServiceRequest.query.filter_by(customer_id=customer_id).count()
            pending_requests = ServiceRequest.query.filter_by(customer_id=customer_id, service_status='Pending').count()
            completed_requests = ServiceRequest.query.filter_by(customer_id=customer_id, service_status='Completed').count()
            cancelled_requests = ServiceRequest.query.filter_by(customer_id=customer_id, service_status='Canceled').count()

            average_rating = db.session.query(db.func.avg(Review.rating)).filter(Review.customer_id == customer_id).scalar() or 0
            
            total_spending = db.session.query(db.func.sum(Service.price)).join(ServiceRequest).filter(ServiceRequest.customer_id == customer_id).scalar() or 0
            
            most_requested_service = (db.session.query(ServiceRequest.service_id)
                                    .filter(ServiceRequest.customer_id == customer_id)
                                    .group_by(ServiceRequest.service_id)
                                    .order_by(db.func.count(ServiceRequest.id).desc())
                                    .first())
            
            most_requested_service_name = None
            if most_requested_service:
                service = Service.query.get(most_requested_service.service_id)
                most_requested_service_name = service.name if service else 'N/A'
            
            last_service_request = (ServiceRequest.query.filter_by(customer_id=customer_id)
                                    .order_by(ServiceRequest.date_of_request.desc())
                                    .first())
            
            last_service_request_date = last_service_request.date_of_request if last_service_request else 'N/A'
            
            total_professionals_engaged = (db.session.query(ServiceRequest.professional_id)
                                            .filter(ServiceRequest.customer_id == customer_id)
                                            .distinct().count())
            
            # Spending by service
            spending_by_service = (db.session.query(Service.name, db.func.sum(Service.price))
                                    .join(ServiceRequest)
                                    .filter(ServiceRequest.customer_id == customer_id)
                                    .group_by(Service.name)
                                    .all())
            
            spending_by_service_dict = {service_name: total_spending for service_name, total_spending in spending_by_service}

            response = {
                "totalServiceRequests": total_service_requests,
                "pendingRequests": pending_requests,
                "completedRequests": completed_requests,
                "cancelledRequests": cancelled_requests,
                "averageRating": average_rating,
                "totalSpending": total_spending,
                "mostRequestedService": most_requested_service_name,
                "lastServiceRequestDate": last_service_request_date,
                "totalProfessionalsEngaged": total_professionals_engaged,
                "spendingByService": spending_by_service_dict,  # Now a dictionary
            }

            return jsonify(response), 200

        except Exception as e:
            logging.error(f"Error fetching customer statistics: {e}")
            return jsonify({"error": "An error occurred while fetching statistics."}), 500

    def extract_customer_id_from_token(token):
        # Implement your logic to extract the customer ID from the token
        return current_user.id
