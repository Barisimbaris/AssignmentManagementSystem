import json
import requests
import smtplib
import os
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

class AMSTestMonitor:
    def __init__(self):
        self.webhook_url = os.getenv('TEAMS_WEBHOOK_URL')
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.email_user = os.getenv('EMAIL_USER')
        self.email_password = os.getenv('EMAIL_PASSWORD')
        self.notification_emails = os.getenv('NOTIFICATION_EMAILS', '').split(',')
        
    def parse_newman_report(self, report_path):
        """Parse Newman JSON report and extract metrics"""
        try:
            with open(report_path, 'r') as f:
                report = json.load(f)
                
            stats = report.get('run', {}).get('stats', {})
            
            return {
                'total_tests': stats.get('tests', {}).get('total', 0),
                'passed_tests': stats.get('tests', {}).get('passed', 0),
                'failed_tests': stats.get('tests', {}).get('failed', 0),
                'total_requests': stats.get('requests', {}).get('total', 0),
                'failed_requests': stats.get('requests', {}).get('failed', 0),
                'total_time': stats.get('requests', {}).get('total', 0),
                'average_response_time': self.calculate_average_response_time(report),
                'failures': self.extract_failures(report)
            }
        except Exception as e:
            print(f"Error parsing report: {e}")
            return None
    
    def calculate_average_response_time(self, report):
        """Calculate average response time from report"""
        try:
            executions = report.get('run', {}).get('executions', [])
            total_time = 0
            total_requests = 0
            
            for execution in executions:
                response = execution.get('response', {})
                if response:
                    total_time += response.get('responseTime', 0)
                    total_requests += 1
            
            return round(total_time / total_requests, 2) if total_requests > 0 else 0
        except:
            return 0
    
    def extract_failures(self, report):
        """Extract failed test details"""
        failures = []
        executions = report.get('run', {}).get('executions', [])
        
        for execution in executions:
            assertions = execution.get('assertions', [])
            for assertion in assertions:
                if assertion.get('error'):
                    failures.append({
                        'test_name': assertion.get('assertion', 'Unknown'),
                        'error': assertion.get('error', {}).get('message', 'Unknown error'),
                        'request': execution.get('item', {}).get('name', 'Unknown request')
                    })
        
        return failures
    
    def send_teams_notification(self, metrics, success):
        """Send notification to Microsoft Teams"""
        if not self.webhook_url:
            return
            
        try:
            if success:
                title = "? AMS API Tests - All Passed"
                color = "28a745"
                summary = f"All {metrics['total_tests']} tests passed successfully!"
            else:
                title = "? AMS API Tests - Failures Detected"
                color = "dc3545"
                summary = f"{metrics['failed_tests']} out of {metrics['total_tests']} tests failed!"
            
            message = {
                "@type": "MessageCard",
                "@context": "https://schema.org/extensions",
                "themeColor": color,
                "summary": summary,
                "sections": [{
                    "activityTitle": title,
                    "activitySubtitle": f"Test execution completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                    "facts": [
                        {"name": "Total Tests", "value": str(metrics['total_tests'])},
                        {"name": "Passed", "value": str(metrics['passed_tests'])},
                        {"name": "Failed", "value": str(metrics['failed_tests'])},
                        {"name": "Total Requests", "value": str(metrics['total_requests'])},
                        {"name": "Avg Response Time", "value": f"{metrics['average_response_time']}ms"}
                    ]
                }]
            }
            
            if not success and metrics['failures']:
                message["sections"].append({
                    "activityTitle": "Failed Tests",
                    "facts": [
                        {"name": f"? {failure['test_name']}", "value": failure['error']}
                        for failure in metrics['failures'][:5]  # Limit to 5 failures
                    ]
                })
            
            response = requests.post(self.webhook_url, json=message, timeout=10)
            response.raise_for_status()
            print("? Teams notification sent successfully")
            
        except Exception as e:
            print(f"? Failed to send Teams notification: {e}")
    
    def send_email_notification(self, metrics, success):
        """Send email notification"""
        if not self.email_user or not self.notification_emails:
            return
            
        try:
            subject = "? AMS API Tests Passed" if success else "? AMS API Tests Failed"
            
            html_body = f"""
            <html>
            <head></head>
            <body>
                <h2 style="color: {'green' if success else 'red'};">{subject}</h2>
                <h3>Test Summary</h3>
                <table border="1" style="border-collapse: collapse;">
                    <tr><td><strong>Total Tests</strong></td><td>{metrics['total_tests']}</td></tr>
                    <tr><td><strong>Passed</strong></td><td style="color: green;">{metrics['passed_tests']}</td></tr>
                    <tr><td><strong>Failed</strong></td><td style="color: red;">{metrics['failed_tests']}</td></tr>
                    <tr><td><strong>Total Requests</strong></td><td>{metrics['total_requests']}</td></tr>
                    <tr><td><strong>Average Response Time</strong></td><td>{metrics['average_response_time']}ms</td></tr>
                </table>
                
                <h3>Execution Details</h3>
                <p><strong>Timestamp:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                <p><strong>Environment:</strong> {os.getenv('ENVIRONMENT', 'Unknown')}</p>
            """
            
            if not success and metrics['failures']:
                html_body += """
                <h3 style="color: red;">Failed Tests</h3>
                <ul>
                """
                for failure in metrics['failures']:
                    html_body += f"<li><strong>{failure['test_name']}</strong>: {failure['error']}</li>"
                html_body += "</ul>"
            
            html_body += """
                <p>Check the detailed reports for more information.</p>
            </body>
            </html>
            """
            
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.email_user
            msg['To'] = ', '.join(self.notification_emails)
            
            html_part = MIMEText(html_body, 'html')
            msg.attach(html_part)
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.email_user, self.email_password)
                server.send_message(msg)
            
            print("? Email notification sent successfully")
            
        except Exception as e:
            print(f"? Failed to send email notification: {e}")
    
    def monitor_test_results(self, report_path):
        """Main monitoring function"""
        print(f"?? Monitoring test results from: {report_path}")
        
        metrics = self.parse_newman_report(report_path)
        if not metrics:
            print("? Failed to parse Newman report")
            return False
        
        success = metrics['failed_tests'] == 0
        
        print(f"?? Test Results Summary:")
        print(f"  • Total Tests: {metrics['total_tests']}")
        print(f"  • Passed: {metrics['passed_tests']}")
        print(f"  • Failed: {metrics['failed_tests']}")
        print(f"  • Average Response Time: {metrics['average_response_time']}ms")
        
        # Send notifications
        self.send_teams_notification(metrics, success)
        self.send_email_notification(metrics, success)
        
        return success

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python monitor.py <newman_report_path>")
        sys.exit(1)
    
    report_path = sys.argv[1]
    monitor = AMSTestMonitor()
    
    success = monitor.monitor_test_results(report_path)
    sys.exit(0 if success else 1)