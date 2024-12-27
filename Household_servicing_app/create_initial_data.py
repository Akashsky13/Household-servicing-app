from flask_security import SQLAlchemyUserDatastore
from flask_security.utils import hash_password
from extentions import db
from datetime import datetime

def create_data(user_datastore: SQLAlchemyUserDatastore):
    print('### creating Data #######')

    # create roles
    user_datastore.find_or_create_role(name='admin', description="Administrator")
    user_datastore.find_or_create_role(name='prof', description="Professional")
    user_datastore.find_or_create_role(name='cust', description="Customer")

    # create user data

    if not user_datastore.find_user(email="admin"):
        user_datastore.create_user(
            email="admin",
            password=hash_password('pass'),
            active=True,
            roles=['admin'],
            full_name="Admin User",  # Add full name
            mobile="9999999999",     # Add a default or placeholder mobile
            location="Admin City",   # Add a default location
            pincode="000001",       # Add a default pincode
            date_created=datetime.utcnow()
                # Add date_created
        )

    db.session.commit()
