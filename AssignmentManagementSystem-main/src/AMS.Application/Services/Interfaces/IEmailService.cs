using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.Services.Interfaces
{
    public interface IEmailService
    {
        Task SendAssignmentNotificationAsync(string toEmail, string studentName, string assignmentTitle, DateTime dueDate, string className);
        Task SendGradeNotificationAsync(string toEmail, string studentName, string assignmentTitle, int score, int maxScore);
        Task SendWelcomeEmailAsync(string toEmail, string userName, string temporaryPassword);
        Task SendClassEnrollmentNotificationAsync(string toEmail, string studentName, string className, string courseCode);
        Task SendAssignmentReminderAsync(string toEmail, string studentName, string assignmentTitle, DateTime dueDate);
        Task SendEmailAsync(string toEmail, string subject, string body);
    }
}