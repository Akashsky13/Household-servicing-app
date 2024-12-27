from extentions import db, security
from flask_security import UserMixin, RoleMixin
from flask_security.models import fsqla_v3 as fsq
from datetime import datetime
from sqlalchemy.orm import validates

# Set up Flask-Security to use Flask-SQLAlchemy models
fsq.FsModels.set_db_info(db)

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String, nullable=False, unique=True)
    password = db.Column(db.String, nullable=False)
    active = db.Column(db.Boolean)
    fs_uniquifier = db.Column(db.String(), nullable=False)
    roles = db.relationship('Role', secondary='user_roles')
    
    # Common Fields inputs
    full_name = db.Column(db.String, nullable=False)
    mobile = db.Column(db.String, nullable=True)
    location = db.Column(db.String, nullable=True)
    pincode = db.Column(db.String, nullable=True)
    date_created = db.Column(db.DateTime, default=datetime.utcnow)  # Default to UTC
    last_login = db.Column(db.DateTime, nullable=True)
    
    # Professional inputs
    service_type = db.Column(db.String, nullable=True)
    experience_years = db.Column(db.Integer, nullable=True)
    documents = db.Column(db.String, nullable=True)
    blocked = db.Column(db.Boolean, default=False)

    # Relationships for reviews
    reviews_received = db.relationship('Review', foreign_keys='Review.professional_id', backref='professional', lazy=True)
    reviews_written = db.relationship('Review', foreign_keys='Review.customer_id', backref='customer', lazy=True)

class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    professional_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False) 
    customer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    rating = db.Column(db.Float, nullable=False)
    review_text = db.Column(db.Text, nullable=True)
    date_created = db.Column(db.DateTime, default=datetime.utcnow)  

    @validates('rating')
    def validate_rating(self, key, value):
        if not isinstance(value, (int, float)):
            raise ValueError("Rating must be a number.")
        if value < 1 or value > 5:
            raise ValueError("Rating must be between 1 and 5")
        return value

class Role(db.Model, RoleMixin):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.String)

class UserRoles(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'))

class Service(db.Model):
    __tablename__ = 'services' 
    id = db.Column(db.Integer, primary_key=True)  
    name = db.Column(db.String(100), nullable=False)  
    price = db.Column(db.Float, nullable=False)  
    time_required = db.Column(db.String(50), nullable=False)  
    description = db.Column(db.Text, nullable=True)  
    professionals = db.relationship('ProfessionalServices', back_populates='service')

    def __repr__(self):
        return f"<Service(name={self.name}, price={self.price})>"

class ServiceRequest(db.Model):
    __tablename__ = 'service_requests'
    id = db.Column(db.Integer, primary_key=True)
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    professional_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    date_of_request = db.Column(db.DateTime, default=datetime.utcnow)
    date_of_completion = db.Column(db.DateTime, nullable=True)
    service_status = db.Column(db.String(20), default='Pending')
    remarks = db.Column(db.Text, nullable=True)
    service = db.relationship('Service', backref='service_requests')
    customer = db.relationship('User', foreign_keys=[customer_id])
    professional = db.relationship('User', foreign_keys=[professional_id])

    def __repr__(self):
        return f"<ServiceRequest(service_id={self.service_id}, customer_id={self.customer_id}, status={self.service_status})>"

class ProfessionalServices(db.Model):
    __tablename__ = 'professional_services'
    id = db.Column(db.Integer, primary_key=True)
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=False)  
    professional_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  
    service = db.relationship('Service', back_populates='professionals')  
    professional = db.relationship('User', backref='professional_services') 
    def __repr__(self):
        return f"<ProfessionalServices(service_id={self.service_id}, professional_id={self.professional_id})>"
