from flask_sqlalchemy import SQLAlchemy
from flask_security import Security
from flask_caching import Cache
from flask_mail import Mail

db = SQLAlchemy()
security = Security()
cache = Cache()
mail = Mail()