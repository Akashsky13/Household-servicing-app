from celery import shared_task
from flask import current_app
import time
import csv
import os
from io import StringIO
from flask_excel import make_response_from_query_sets
from models import User, ServiceRequest, Review, Role
from extentions import mail
from flask_mail import Message
from sqlalchemy import and_
from datetime import datetime, timedelta
import logging
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
import matplotlib.pyplot as plt

logging.basicConfig(level=logging.INFO)

@shared_task()
def send_reminders(subject, body):
    time_threshold = datetime.utcnow() - timedelta(hours=24)
    inactive_users = User.query.filter(User.last_login < time_threshold).all()
    
    for user in inactive_users:
        msg = Message(subject, recipients=[user.email])
        msg.body = body
        try:
            mail.send(msg)
            logging.info(f"Email sent to {user.email}")
        except Exception as e:
            logging.error(f"Error sending email to {user.email}: {e}")

    return f"Emails sent to {len(inactive_users)} inactive users."

@shared_task
def export_closed_requests_to_csv():
    time.sleep(15)
    closed_requests = ServiceRequest.query.filter_by(service_status='Closed').all()
    csv_data = StringIO()
    writer = csv.writer(csv_data)
    writer.writerow(['Service ID', 'Customer ID', 'Professional ID', 'Date of Request', 'Remarks'])

    for request in closed_requests:
        writer.writerow([request.id, request.customer_id, request.professional_id, request.date_of_request, request.remarks])

    file_path = os.path.join('./user-downloads', 'closed_requests.csv')
    os.makedirs(os.path.dirname(file_path), exist_ok=True)  
    with open(file_path, 'w') as f:
        f.write(csv_data.getvalue())

    logging.info("Exported closed requests to CSV.")
    return file_path

@shared_task()
def send_offers(subject, body):
    users = User.query.with_entities(User.email).all()
    for user in users:
        msg = Message(subject, recipients=[user.email])
        msg.body = body
        try:
            mail.send(msg)
            logging.info(f"Email sent to {user.email}")
        except Exception as e:
            logging.error(f"Error sending email to {user.email}: {e}")

    return f"Emails sent to {len(users)} users."


# task to send monthly report to customers --------------------

@shared_task()
def send_customer_monthly_report():
    customers = User.query.filter(User.roles.any(Role.name == 'cust')).all()
    
    for customer in customers:
        service_requests = ServiceRequest.query.filter_by(customer_id=customer.id).all()
        reviews = Review.query.filter_by(customer_id=customer.id).all()
        
        report_data = {
            'customer_name': customer.full_name,
            'total_service_requests': len(service_requests),
            'total_reviews': len(reviews),
            'average_rating': (sum(review.rating for review in reviews) / len(reviews)) if reviews else 0,
            'service_requests': service_requests,
            'reviews': reviews
        }
        
        pdf_file_path = generate_pdf_report_for_customer(report_data)
        chart_file_path = generate_chart_for_customer(report_data)
        
        if pdf_file_path and chart_file_path: 
            send_email_with_report(customer.email, pdf_file_path, chart_file_path)



# task for professionals------------------------------------------

@shared_task()
def check_pending_requests_for_professionals():
    professionals = User.query.filter(User.roles.any(Role.name == 'prof')).all()

    for professional in professionals:
        pending_requests = ServiceRequest.query.filter(
            and_(
                ServiceRequest.professional_id == professional.id,
                ServiceRequest.service_status == 'Pending'  
            )
        ).all()

        if pending_requests:
            subject = "Pending Service Requests Alert"
            body = f"Dear {professional.full_name},\n\n"
            body += "You have pending service requests that require your attention:\n"

            for request in pending_requests:
                if request.customer:  
                    location = request.customer.location or "Location not provided" 
                    body += (f"- Service ID: {request.id}, Customer Name: {request.customer.full_name}, "
                             f"Location: {location}, Date of Request: {request.date_of_request}\n")

            body += "\nPlease visit your dashboard to accept or reject these requests."
            msg = Message(subject, recipients=[professional.email])
            msg.body = body
            try:
                mail.send(msg)
                logging.info(f"Alert sent to {professional.email} regarding pending requests.")
            except Exception as e:
                logging.error(f"Error sending alert to {professional.email}: {e}")

    return "Pending request alerts sent to professionals."





# some definitions for the monthly report------------------------------------------------

def generate_pdf_report_for_customer(report_data):
    os.makedirs('./reports', exist_ok=True)
    pdf_file_path = f"./reports/{report_data['customer_name']}_monthly_report.pdf"
    
    try:
        doc = SimpleDocTemplate(pdf_file_path, pagesize=letter)
        elements = []
        elements.append(Paragraph(f"Monthly Report for {report_data['customer_name']}", style=None))
        elements.append(Spacer(1, 12))
        elements.append(Paragraph(f"Total Service Requests: {report_data['total_service_requests']}", style=None))
        elements.append(Paragraph(f"Total Reviews: {report_data['total_reviews']}", style=None))
        elements.append(Paragraph(f"Average Rating: {report_data['average_rating']:.2f}", style=None))
        elements.append(Spacer(1, 12))

        data = [['Service ID', 'Professional ID', 'Status']]
        for request in report_data['service_requests']:
            data.append([request.id, request.professional_id, request.service_status])
        
        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(table)

        doc.build(elements)
        logging.info(f"PDF report generated for {report_data['customer_name']}")
        return pdf_file_path
    except Exception as e:
        logging.error(f"Error generating PDF report: {e}")
        return None

def generate_chart_for_customer(report_data):
    os.makedirs('./charts', exist_ok=True)  # Ensure charts directory exists
    chart_file_path = f"./charts/{report_data['customer_name']}_performance_chart.png"

    if 'service_requests' in report_data:
        x_labels = [f'Service {req.id}' for req in report_data['service_requests']]
        ratings = [req.service_status for req in report_data['service_requests']]  # or some other metric

        plt.bar(x_labels, ratings, color='blue')
        plt.xlabel('Service Requests')
        plt.ylabel('Status')
        plt.title(f"Performance Chart for {report_data['customer_name']}")
        plt.xticks(rotation=45)

        plt.tight_layout()  # Adjust layout for better fit
        plt.savefig(chart_file_path)
        plt.close()
        logging.info(f"Chart generated for {report_data['customer_name']}")
        return chart_file_path
    else:
        logging.warning("No service requests found in report_data.")
        return None

def send_email_with_report(email, pdf_file_path, chart_file_path):
    if os.path.exists(pdf_file_path) and os.path.exists(chart_file_path):
        msg = Message("Your Monthly Report", recipients=[email])
        msg.body = "Please find attached your monthly report and performance chart."

        with current_app.app_context():
            with current_app.open_resource(pdf_file_path) as pdf:
                msg.attach("monthly_report.pdf", "application/pdf", pdf.read())
            with current_app.open_resource(chart_file_path) as chart:
                msg.attach("performance_chart.png", "image/png", chart.read())
            try:
                mail.send(msg)
                logging.info(f"Email with report sent to {email}")
            except Exception as e:
                logging.error(f"Error sending report email to {email}: {e}")
    else:
        logging.error("Cannot send email: PDF or chart file does not exist.")