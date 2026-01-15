using AMS.Application.Common.Results;
using AMS.Application.DTOs.Notification;
using AMS.Application.Services.Interfaces;
using AMS.Domain.Entities;
using AMS.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.Services.Implementations
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notificationRepository;
        private readonly IAssignmentRepository _assignmentRepository;
        private readonly ISubmissionRepository _submissionRepository;
        private readonly IClassRepository _classRepository;
        private readonly IUserRepository _userRepository;
        private readonly IEnrollmentRepository _enrollmentRepository;
        private readonly IClassScheduleRepository _scheduleRepository; // ✅ YENİ
        private readonly IEmailService _emailService;

        public NotificationService(
            INotificationRepository notificationRepository,
            IAssignmentRepository assignmentRepository,
            ISubmissionRepository submissionRepository,
            IClassRepository classRepository,
            IUserRepository userRepository,
            IEnrollmentRepository enrollmentRepository,
            IClassScheduleRepository scheduleRepository, // ✅ YENİ
            IEmailService emailService)
        {
            _notificationRepository = notificationRepository;
            _assignmentRepository = assignmentRepository;
            _submissionRepository = submissionRepository;
            _classRepository = classRepository;
            _userRepository = userRepository;
            _enrollmentRepository = enrollmentRepository;
            _scheduleRepository = scheduleRepository; // ✅ YENİ
            _emailService = emailService;
        }

        public async Task CreateAndSendAssignmentNotificationAsync(int assignmentId, List<int> studentIds)
        {
            var assignment = await _assignmentRepository.GetByIdAsync(assignmentId);
            if (assignment == null) return;

            foreach (var studentId in studentIds)
            {
                var student = await _userRepository.GetByIdAsync(studentId);
                if (student == null) continue;

                // Create notification
                var notification = new Notification
                {
                    UserId = studentId,
                    Title = "New Assignment",
                    Message = $"A new assignment '{assignment.Title}' has been created for {assignment.Class.ClassName}. Due date: {assignment.DueDate:yyyy-MM-dd HH:mm}",
                    RelatedEntityType = "Assignment",
                    RelatedEntityId = assignmentId,
                    CreatedAt = DateTime.UtcNow
                };

                await _notificationRepository.AddAsync(notification);

                // Send email
                try
                {
                    await _emailService.SendAssignmentNotificationAsync(
                        student.Email,
                        $"{student.FirstName} {student.LastName}",
                        assignment.Title,
                        assignment.DueDate,
                        assignment.Class.ClassName
                    );
                }
                catch (Exception ex)
                {
                    // Log email error but don't break the notification creation
                    // You might want to use a proper logging framework here
                    Console.WriteLine($"Failed to send email to {student.Email}: {ex.Message}");
                }
            }

            await _notificationRepository.SaveChangesAsync();
        }

        public async Task CreateAndSendGradeNotificationAsync(int submissionId, int studentId, int score, int maxScore)
        {
            var submission = await _submissionRepository.GetByIdAsync(submissionId);
            if (submission == null) return;

            var student = await _userRepository.GetByIdAsync(studentId);
            if (student == null) return;

            var notification = new Notification
            {
                UserId = studentId,
                Title = "Assignment Graded",
                Message = $"Your assignment '{submission.Assignment.Title}' has been graded. Score: {score}/{maxScore}",
                RelatedEntityType = "Submission",
                RelatedEntityId = submissionId,
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepository.AddAsync(notification);
            await _notificationRepository.SaveChangesAsync();

            // Send email notification 
            try
            {
                await _emailService.SendGradeNotificationAsync(
                    student.Email,
                    $"{student.FirstName} {student.LastName}",
                    submission.Assignment.Title,
                    score,
                    maxScore
                );
            }
            catch (Exception ex)
            {
                // Log email error but don't break the notification creation
                Console.WriteLine($"Failed to send email to {student.Email}: {ex.Message}");
            }
        }

        public async Task CreateAndSendEnrollmentNotificationAsync(int classId, int studentId)
        {
            var classEntity = await _classRepository.GetByIdAsync(classId);
            if (classEntity == null) return;

            var student = await _userRepository.GetByIdAsync(studentId);
            if (student == null) return;

            var notification = new Notification
            {
                UserId = studentId,
                Title = "Class Enrollment",
                Message = $"You have been enrolled in {classEntity.ClassName} ({classEntity.Course.CourseCode})",
                RelatedEntityType = "Class",
                RelatedEntityId = classId,
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepository.AddAsync(notification);
            await _notificationRepository.SaveChangesAsync();

            try
            {
                await _emailService.SendClassEnrollmentNotificationAsync(
                    student.Email,
                    $"{student.FirstName} {student.LastName}",
                    classEntity.ClassName,
                    classEntity.Course.CourseCode
                );
            }
            catch (Exception ex)
            {
                // Log email error but don't break the notification creation
                Console.WriteLine($"Failed to send email to {student.Email}: {ex.Message}");
            }
        }

        // ✅ YENİ: Schedule oluşturulduğunda öğrencilere notification gönder
        public async Task CreateAndSendScheduleNotificationAsync(int scheduleId, int classId, List<int> studentIds)
        {
            var schedule = await _scheduleRepository.GetByIdAsync(scheduleId);
            if (schedule == null) return;

            var classEntity = await _classRepository.GetByIdAsync(classId);
            if (classEntity == null) return;

            // Gün adını Türkçe'ye çevir
            var dayNames = new Dictionary<DayOfWeek, string>
            {
                { DayOfWeek.Monday, "Pazartesi" },
                { DayOfWeek.Tuesday, "Salı" },
                { DayOfWeek.Wednesday, "Çarşamba" },
                { DayOfWeek.Thursday, "Perşembe" },
                { DayOfWeek.Friday, "Cuma" },
                { DayOfWeek.Saturday, "Cumartesi" },
                { DayOfWeek.Sunday, "Pazar" }
            };

            var dayName = dayNames.ContainsKey(schedule.DayOfWeek) 
                ? dayNames[schedule.DayOfWeek] 
                : schedule.DayOfWeek.ToString();

            var startTime = schedule.StartTime.ToString(@"hh\:mm");
            var endTime = schedule.EndTime.ToString(@"hh\:mm");
            var location = !string.IsNullOrEmpty(schedule.RoomNumber) 
                ? schedule.RoomNumber 
                : "Belirtilmemiş";

            if (!string.IsNullOrEmpty(schedule.Building))
            {
                location = $"{schedule.Building} - {location}";
            }

            foreach (var studentId in studentIds)
            {
                var student = await _userRepository.GetByIdAsync(studentId);
                if (student == null) continue;

                var notification = new Notification
                {
                    UserId = studentId,
                    Title = "Yeni Ders Programı",
                    Message = $"{classEntity.ClassName} için yeni ders programı eklendi. {dayName} günü {startTime}-{endTime} saatleri arası. Yer: {location}",
                    RelatedEntityType = "ClassSchedule",
                    RelatedEntityId = scheduleId,
                    CreatedAt = DateTime.UtcNow
                };

                await _notificationRepository.AddAsync(notification);
            }

            await _notificationRepository.SaveChangesAsync();
        }

        public async Task MarkAsReadAsync(int notificationId, int userId)
        {
            var notification = await _notificationRepository.GetByIdAsync(notificationId);
            if (notification == null || notification.UserId != userId) return;

            notification.IsRead = true;
            notification.UpdatedAt = DateTime.UtcNow;

            await _notificationRepository.UpdateAsync(notification);
            await _notificationRepository.SaveChangesAsync();
        }

        public async Task<Result<List<NotificationResponseDto>>> GetUserNotificationsAsync(int userId)
        {
            var notifications = await _notificationRepository.GetByUserIdAsync(userId);

            var response = notifications.Select(n => new NotificationResponseDto
            {
                Id = n.Id,
                UserId = n.UserId,
                Title = n.Title,
                Message = n.Message,
                IsRead = n.IsRead,
                RelatedEntityType = n.RelatedEntityType,
                RelatedEntityId = n.RelatedEntityId,
                CreatedAt = n.CreatedAt
            }).ToList();

            return Result<List<NotificationResponseDto>>.Success(response);
        }

        public async Task<Result<int>> GetUnreadCountAsync(int userId)
        {
            var count = await _notificationRepository.GetUnreadCountByUserIdAsync(userId);
            return Result<int>.Success(count);
        }
    }
}