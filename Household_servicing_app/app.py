from flask import Flask
import login
import admin
import customer
import professional
from extentions import db, security, cache
from create_initial_data import create_data
from worker import celery_init_app
import flask_excel as excel
import os
from extentions import mail
from flask_cors import CORS
from tasks import send_reminders,send_customer_monthly_report,check_pending_requests_for_professionals,send_offers
from celery.schedules import crontab

def create_app():
    app = Flask(__name__)

    # Basic app configuration
    app.config['SECRET_KEY'] = "should-not-be-exposed"
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///data.db"
    app.config['SECURITY_PASSWORD_SALT'] = 'salty-password'

    # Token config
    app.config['SECURITY_TOKEN_AUTHENTICATION_HEADER'] = 'Authentication-Token'

    app.config['SECURITY_TOKEN_MAX_AGE'] = 3600  # 1 hour
    app.config['SECURITY_LOGIN_WITHOUT_CONFIRMATION'] = True
    CORS(app, supports_credentials=True) 

    app.config['SECURITY_LOGIN_URL'] = '/user-login'
    app.config['SECURITY_LOGOUT_URL'] = '/logout'  # Define your logout route as needed

    # Cache config
    app.config["DEBUG"] = True
    app.config["CACHE_TYPE"] = "RedisCache"
    app.config['CACHE_REDIS_HOST'] = 'localhost'
    app.config['CACHE_REDIS_PORT'] = 6379
    app.config['CACHE_REDIS_DB'] = 0
    app.config['CACHE_REDIS_URL'] = 'redis://localhost:6379/0'
    app.config["CACHE_DEFAULT_TIMEOUT"] = 300

    # Upload folder and size limits
    app.config['UPLOAD_FOLDER'] = 'uploads/'  # Folder where ZIP files will be stored
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB max upload size

    # Ensure the uploads folder exists
    try:
        if not os.path.exists(app.config['UPLOAD_FOLDER']):
            os.makedirs(app.config['UPLOAD_FOLDER'])
    except Exception as e:
        print(f"Error creating upload folder: {e}")
        raise

    # Flask-Mail configuration
    app.config.update(
        MAIL_SERVER='smtp.gmail.com',
        MAIL_PORT=587,
        MAIL_USE_TLS=True,
        MAIL_USERNAME='akashmauryapi007@gmail.com',
        MAIL_PASSWORD='hbwk sohj pvjp rwgl',
        MAIL_DEFAULT_SENDER='akashmauryapi007@gmail.com'
    )

    mail.init_app(app)  # Initialize Flask-Mail

    # Initialize extensions
    cache.init_app(app)
    db.init_app(app)

    with app.app_context():
        from models import User, Role
        from flask_security import SQLAlchemyUserDatastore

        user_datastore = SQLAlchemyUserDatastore(db, User, Role)
        security.init_app(app, user_datastore, register_blueprint=False)

        # Create tables
        db.create_all()

        # Create initial data (e.g., roles)
        create_data(user_datastore)

    # Disable CSRF security for specific endpoints (if needed)
    app.config['WTF_CSRF_CHECK_DEFAULT'] = False
    app.config['SECURITY_CSRF_PROTECT_MECHANISHMS'] = []
    app.config['SECURITY_CSRF_IGNORE_UNAUTH_ENDPOINTS'] = True

    # Initialize python files
    login.create_view(app, user_datastore, cache)
    admin.create_admin(app, user_datastore)
    customer.create_cust(app, user_datastore, cache)
    professional.create_prof(app, user_datastore, cache)
    return app


app = create_app()
celery_app = celery_init_app(app)
excel.init_excel(app)
from celery.schedules import crontab

@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    
    sender.add_periodic_task(
        crontab(hour=12, minute=45), 
        send_reminders.s("Reminder","It's been a while you visited the app, Don't forget to check our latest added services!"), 
        name='sending reminders at 6 AM'
    )
    sender.add_periodic_task(
        crontab(hour=17, minute=0), 
        send_reminders.s("Reminder","It's been a while you visited the app, Don't forget to check our latest added services!"),  
        name='sending reminders at 5 PM'
    )
    
    sender.add_periodic_task(
        crontab(minute=0, hour='*/2'), 
        check_pending_requests_for_professionals.s(), 
        name='sending emils for pending requests in every 2 hours'
    )
    
    sender.add_periodic_task(
        crontab(hour=8, minute=0, day_of_month=1), 
        send_customer_monthly_report.s(), 
        name='send monthly reports to professionals'
    )

if __name__ == "__main__":

    app.run(debug=True)
