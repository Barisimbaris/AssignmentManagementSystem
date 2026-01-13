using AMS.Application.Services.Interfaces;
using AMS.Application.Settings;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mail;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Infrastructure.Services
{
    public class EmailService : IEmailService
    {
        private readonly EmailSettings _emailSettings;

        public EmailService(IOptions<EmailSettings> emailSettings)
        {
            _emailSettings = emailSettings.Value;
        }

        public async Task SendAssignmentNotificationAsync(string toEmail, string studentName, string assignmentTitle, DateTime dueDate, string className)
        {
            var subject = $"New Assignment: {assignmentTitle}";
            var body = $@"
                <html>
                <body>
                    <h2>New Assignment Notification</h2>
                    <p>Hello {studentName},</p>
                    
                    <p>A new assignment has been created for your class:</p>
                    
                    <ul>
                        <li><strong>Assignment:</strong> {assignmentTitle}</li>
                        <li><strong>Class:</strong> {className}</li>
                        <li><strong>Due Date:</strong> {dueDate:yyyy-MM-dd HH:mm}</li>
                    </ul>
                    
                    <p>Please log in to the AMP system to view the assignment details and submit your work.</p>
                    
                    <p>Best regards,<br/>
                    Assignment Management Platform (AMP)</p>
                </body>
                </html>
            ";

            await SendEmailAsync(toEmail, subject, body);
        }

        public async Task SendGradeNotificationAsync(string toEmail, string studentName, string assignmentTitle, int score, int maxScore)
        {
            var percentage = (double)score / maxScore * 100;
            var subject = $"Grade Released: {assignmentTitle}";
            var body = $@"
                <html>
                <body>
                    <h2>Grade Notification</h2>
                    <p>Hello {studentName},</p>
                    
                    <p>Your assignment has been graded:</p>
                    
                    <ul>
                        <li><strong>Assignment:</strong> {assignmentTitle}</li>
                        <li><strong>Score:</strong> {score}/{maxScore} ({percentage:F1}%)</li>
                    </ul>
                    
                    <p>Please log in to the AMP system to view detailed feedback.</p>
                    
                    <p>Best regards,<br/>
                    Assignment Management Platform (AMP)</p>
                </body>
                </html>
            ";

            await SendEmailAsync(toEmail, subject, body);
        }

        public async Task SendWelcomeEmailAsync(string toEmail, string userName, string temporaryPassword)
        {
            var subject = "Welcome to Assignment Management Platform (AMP)";
            var body = $@"
                <html>
                <body>
                    <h2>Welcome to AMP</h2>
                    <p>Hello {userName},</p>
                    
                    <p>Your account has been created in the Assignment Management Platform.</p>
                    
                    <p><strong>Login Details:</strong></p>
                    <ul>
                        <li><strong>Email:</strong> {toEmail}</li>
                        <li><strong>Temporary Password:</strong> {temporaryPassword}</li>
                    </ul>
                    
                    <p><strong>Important:</strong> Please change your password after your first login.</p>
                    
                    <p>Best regards,<br/>
                    Assignment Management Platform (AMP)</p>
                </body>
                </html>
            ";

            await SendEmailAsync(toEmail, subject, body);
        }

        public async Task SendClassEnrollmentNotificationAsync(string toEmail, string studentName, string className, string courseCode)
        {
            var subject = $"Enrolled in Class: {className}";
            var body = $@"
                <html>
                <body>
                    <h2>Class Enrollment Confirmation</h2>
                    <p>Hello {studentName},</p>
                    
                    <p>You have been successfully enrolled in:</p>
                    
                    <ul>
                        <li><strong>Class:</strong> {className}</li>
                        <li><strong>Course Code:</strong> {courseCode}</li>
                    </ul>
                    
                    <p>You can now access course materials and assignments for this class.</p>
                    
                    <p>Best regards,<br/>
                    Assignment Management Platform (AMP)</p>
                </body>
                </html>
            ";

            await SendEmailAsync(toEmail, subject, body);
        }

        public async Task SendAssignmentReminderAsync(string toEmail, string studentName, string assignmentTitle, DateTime dueDate)
        {
            var subject = $"Assignment Reminder: {assignmentTitle}";
            var body = $@"
                <html>
                <body>
                    <h2>Assignment Reminder</h2>
                    <p>Hello {studentName},</p>
                    
                    <p>This is a reminder that you have an upcoming assignment deadline:</p>
                    
                    <ul>
                        <li><strong>Assignment:</strong> {assignmentTitle}</li>
                        <li><strong>Due Date:</strong> {dueDate:yyyy-MM-dd HH:mm}</li>
                    </ul>
                    
                    <p>Please ensure you submit your work before the deadline.</p>
                    
                    <p>Best regards,<br/>
                    Assignment Management Platform (AMP)</p>
                </body>
                </html>
            ";

            await SendEmailAsync(toEmail, subject, body);
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            try
            {
                // ? MockMode check
                if (_emailSettings.MockMode)
                {
                    Console.WriteLine("?? [MOCK MODE] Email would be sent:");
                    Console.WriteLine($"  ?? To: {toEmail}");
                    Console.WriteLine($"  ?? Subject: {subject}");
                    Console.WriteLine($"  ?? From: {_emailSettings.FromName} <{_emailSettings.FromEmail}>");
                    Console.WriteLine($"  ? Email simulated successfully!");
                    
                    // Simulate small delay for realism
                    await Task.Delay(50);
                    return;
                }

                using var client = new SmtpClient(_emailSettings.SmtpHost, _emailSettings.SmtpPort);
                client.EnableSsl = _emailSettings.EnableSsl;
                client.Credentials = new NetworkCredential(_emailSettings.FromEmail, _emailSettings.Password);
                client.Timeout = 5000; // ? Reduced to 5 seconds
                client.DeliveryMethod = SmtpDeliveryMethod.Network;

                var message = new MailMessage
                {
                    From = new MailAddress(_emailSettings.FromEmail, _emailSettings.FromName),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true
                };

                message.To.Add(toEmail);

                Console.WriteLine($"?? Sending real email to: {toEmail}");
                Console.WriteLine($"?? Subject: {subject}");
                
                // Add timeout protection
                using var cancellationTokenSource = new CancellationTokenSource(TimeSpan.FromSeconds(8));
                await client.SendMailAsync(message, cancellationTokenSource.Token);
                
                Console.WriteLine($"? Real email sent successfully to: {toEmail}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"? Email send failed: {ex.Message}");
                Console.WriteLine($"?? Email operation failed but API continues normally");
                // Log the exception but don't break the API flow
                // throw new Exception($"Failed to send email: {ex.Message}", ex);
                
                // ? Don't throw exception, just log it
                // This prevents email issues from blocking API operations
            }
        }
    }
}