using AMS.Application.Common.Results;
using AMS.Application.DTOs.Notification;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.Services.Interfaces
{
    public interface INotificationService
    {
        Task CreateAndSendAssignmentNotificationAsync(int assignmentId, List<int> studentIds);
        Task CreateAndSendGradeNotificationAsync(int submissionId, int studentId, int score, int maxScore);
        Task CreateAndSendEnrollmentNotificationAsync(int classId, int studentId);
        Task CreateAndSendScheduleNotificationAsync(int scheduleId, int classId, List<int> studentIds); // ✅ YENİ
        Task MarkAsReadAsync(int notificationId, int userId);
        Task<Result<List<NotificationResponseDto>>> GetUserNotificationsAsync(int userId);
        Task<Result<int>> GetUnreadCountAsync(int userId);
    }
}