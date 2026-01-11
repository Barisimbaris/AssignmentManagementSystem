using AMS.Application.Common.Exceptions;
using AMS.Application.Common.Results;
using AMS.Application.DTOs.Assignment;
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
    public class AssignmentService : IAssignmentService
    {
        private readonly IAssignmentRepository _assignmentRepository;
        private readonly IClassRepository _classRepository;
        private readonly ISubmissionRepository _submissionRepository;
        private readonly IUserRepository _userRepository;
        private readonly IEnrollmentRepository _enrollmentRepository;
        private readonly INotificationService _notificationService; // ✅ YENİ

        public AssignmentService(
            IAssignmentRepository assignmentRepository,
            IClassRepository classRepository,
            ISubmissionRepository submissionRepository,
            IUserRepository userRepository,
            IEnrollmentRepository enrollmentRepository,
            INotificationService notificationService) // ✅ YENİ
        {
            _assignmentRepository = assignmentRepository;
            _classRepository = classRepository;
            _submissionRepository = submissionRepository;
            _userRepository = userRepository;
            _enrollmentRepository = enrollmentRepository;
            _notificationService = notificationService; // ✅ YENİ
        }

        public async Task<Result<AssignmentResponseDto>> GetByIdAsync(int id)
        {
            var assignment = await _assignmentRepository.GetByIdAsync(id);

            if (assignment == null)
            {
                throw new NotFoundException("Assignment", id);
            }

            var submissions = await _submissionRepository.GetByAssignmentIdAsync(id);

            var response = new AssignmentResponseDto
            {
                Id = assignment.Id,
                Title = assignment.Title,
                Description = assignment.Description,
                ClassId = assignment.ClassId,
                ClassName = assignment.Class.ClassName,
                AssignmentType = assignment.Type.ToString(),
                Type = assignment.Type.ToString(),              // ✅ EKLE
                DueDate = assignment.DueDate,
                MaxScore = assignment.MaxScore,
                AllowLateSubmission = assignment.AllowLateSubmission,
                AllowResubmission = assignment.AllowResubmission,
                AttachmentPath = assignment.AttachmentPath,
                TotalSubmissions = submissions.Count,
                InstructorId = assignment.Class.InstructorId,  // ✅ EKLE (ÇOK ÖNEMLİ!)
                CreatedAt = assignment.CreatedAt
            };

            return Result<AssignmentResponseDto>.Success(response);
        }

        public async Task<Result<List<AssignmentResponseDto>>> GetAllAsync()
        {
            var assignments = await _assignmentRepository.GetAllAsync();

            var response = new List<AssignmentResponseDto>();

            foreach (var a in assignments)
            {
                var submissions = await _submissionRepository.GetByAssignmentIdAsync(a.Id);

                response.Add(new AssignmentResponseDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Description = a.Description,
                    ClassId = a.ClassId,
                    ClassName = a.Class.ClassName,
                    AssignmentType = a.Type.ToString(),
                    Type = a.Type.ToString(), // ✅ EKLENDİ
                    DueDate = a.DueDate,
                    MaxScore = a.MaxScore,
                    AllowLateSubmission = a.AllowLateSubmission,
                    AllowResubmission = a.AllowResubmission,
                    AttachmentPath = a.AttachmentPath,
                    TotalSubmissions = submissions.Count,
                    InstructorId = a.Class.InstructorId, // ✅ KRİTİK EKLENTİ
                    CreatedAt = a.CreatedAt
                });
            }

            return Result<List<AssignmentResponseDto>>.Success(response);
        }

        public async Task<Result<List<AssignmentResponseDto>>> GetByClassIdAsync(int classId)
        {
            var assignments = await _assignmentRepository.GetByClassIdAsync(classId);

            var response = new List<AssignmentResponseDto>();

            foreach (var a in assignments)
            {
                var submissions = await _submissionRepository.GetByAssignmentIdAsync(a.Id);

                response.Add(new AssignmentResponseDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Description = a.Description,
                    ClassId = a.ClassId,
                    ClassName = a.Class?.ClassName ?? "",
                    AssignmentType = a.Type.ToString(),
                    Type = a.Type.ToString(), // ✅ EKLENDİ
                    DueDate = a.DueDate,
                    MaxScore = a.MaxScore,
                    AllowLateSubmission = a.AllowLateSubmission,
                    AllowResubmission = a.AllowResubmission,
                    AttachmentPath = a.AttachmentPath,
                    TotalSubmissions = submissions.Count,
                    InstructorId = a.Class?.InstructorId ?? 0, // ✅ KRİTİK EKLENTİ
                    CreatedAt = a.CreatedAt
                });
            }

            return Result<List<AssignmentResponseDto>>.Success(response);
        }

        public async Task<Result<List<AssignmentResponseDto>>> GetByStudentIdAsync(int studentId)
        {
            var enrollments = await _enrollmentRepository.GetByStudentIdAsync(studentId);
            var classIds = enrollments.Select(e => e.ClassId).ToList();

            if (!classIds.Any())
            {
                return Result<List<AssignmentResponseDto>>.Success(new List<AssignmentResponseDto>());
            }

            // Bu class'lara ait tüm assignments'ları getir
            var assignments = await _assignmentRepository.GetByClassIdsAsync(classIds);

            var response = assignments.Select(a => new AssignmentResponseDto
            {
                Id = a.Id,
                Title = a.Title,
                Description = a.Description,
                ClassName = a.Class.ClassName,
                ClassId = a.ClassId,
                AssignmentType = a.Type.ToString(),
                Type = a.Type.ToString(),
                DueDate = a.DueDate,
                MaxScore = a.MaxScore,
                AllowLateSubmission = a.AllowLateSubmission,
                AllowResubmission = a.AllowResubmission,
                AttachmentPath = a.AttachmentPath,
                TotalSubmissions = a.Submissions.Count,
                InstructorId = a.Class.InstructorId,
                CreatedAt = a.CreatedAt
            }).ToList();

            return Result<List<AssignmentResponseDto>>.Success(response);
        }
        
        public async Task<Result<AssignmentResponseDto>> CreateAsync(CreateAssignmentRequestDto request, int userId)
        {
            var classEntity = await _classRepository.GetByIdAsync(request.ClassId);

            if (classEntity == null)
            {
                throw new NotFoundException("Class", request.ClassId);
            }

            // Get current user to check role
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new NotFoundException("User", userId);
            }

            // Admin can create assignments for any class
            // Instructor can only create assignments for their own classes
            if (user.Role == Domain.Enums.UserRole.Instructor && classEntity.InstructorId != userId)
            {
                throw new UnauthorizedException("Only the class instructor can create assignments");
            }
            
            // For Admin role, no additional checks needed

            var assignment = new Assignment
            {
                Title = request.Title,
                Description = request.Description,
                ClassId = request.ClassId,
                Type = request.Type,
                DueDate = request.DueDate,
                MaxScore = request.MaxScore,
                AllowLateSubmission = request.AllowLateSubmission,
                AllowResubmission = request.AllowResubmission,
                CreatedAt = DateTime.UtcNow
            };

            await _assignmentRepository.AddAsync(assignment);
            await _assignmentRepository.SaveChangesAsync();

            // ✅ YENİ: Email notification gönder
            var enrollments = await _enrollmentRepository.GetByClassIdAsync(request.ClassId);
            var studentIds = enrollments.Select(e => e.StudentId).ToList();
            
            if (studentIds.Any())
            {
                await _notificationService.CreateAndSendAssignmentNotificationAsync(assignment.Id, studentIds);
            }

            var response = new AssignmentResponseDto
            {
                Id = assignment.Id,
                Title = assignment.Title,
                Description = assignment.Description,
                ClassId = assignment.ClassId,
                ClassName = classEntity.ClassName,
                AssignmentType = assignment.Type.ToString(),
                Type = assignment.Type.ToString(),
                DueDate = assignment.DueDate,
                MaxScore = assignment.MaxScore,
                AllowLateSubmission = request.AllowLateSubmission,
                AllowResubmission = request.AllowResubmission,
                AttachmentPath = assignment.AttachmentPath,
                TotalSubmissions = 0,
                InstructorId = classEntity.InstructorId,
                CreatedAt = assignment.CreatedAt
            };

            return Result<AssignmentResponseDto>.Success(response, "Assignment created successfully");
        }

        public async Task<Result<AssignmentResponseDto>> UpdateAsync(int id, UpdateAssignmentRequestDto request, int userId)
        {
            var assignment = await _assignmentRepository.GetByIdAsync(id);

            if (assignment == null)
            {
                throw new NotFoundException("Assignment", id);
            }

            // Get current user to check role
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new NotFoundException("User", userId);
            }

            // Admin can update any assignment
            // Instructor can only update their own class assignments
            if (user.Role == Domain.Enums.UserRole.Instructor && assignment.Class.InstructorId != userId)
            {
                throw new UnauthorizedException("Only the class instructor can update this assignment");
            }

            if (!string.IsNullOrEmpty(request.Title))
                assignment.Title = request.Title;

            if (!string.IsNullOrEmpty(request.Description))
                assignment.Description = request.Description;

            if (request.DueDate.HasValue)
                assignment.DueDate = request.DueDate.Value;

            if (request.MaxScore.HasValue)
                assignment.MaxScore = request.MaxScore.Value;

            if (request.AllowLateSubmission.HasValue)
                assignment.AllowLateSubmission = request.AllowLateSubmission.Value;

            if (request.AllowResubmission.HasValue)
                assignment.AllowResubmission = request.AllowResubmission.Value;

            assignment.UpdatedAt = DateTime.UtcNow;

            await _assignmentRepository.UpdateAsync(assignment);
            await _assignmentRepository.SaveChangesAsync();

            var submissions = await _submissionRepository.GetByAssignmentIdAsync(id);

            var response = new AssignmentResponseDto
            {
                Id = assignment.Id,
                Title = assignment.Title,
                Description = assignment.Description,
                ClassId = assignment.ClassId,
                ClassName = assignment.Class.ClassName,
                AssignmentType = assignment.Type.ToString(),
                Type = assignment.Type.ToString(), // ✅ EKLENDİ
                DueDate = assignment.DueDate,
                MaxScore = assignment.MaxScore,
                AllowLateSubmission = assignment.AllowLateSubmission,
                AllowResubmission = assignment.AllowResubmission,
                AttachmentPath = assignment.AttachmentPath,
                TotalSubmissions = submissions.Count,
                InstructorId = assignment.Class.InstructorId, // ✅ KRİTİK EKLENTİ
                CreatedAt = assignment.CreatedAt
            };

            return Result<AssignmentResponseDto>.Success(response, "Assignment updated successfully");
        }

        public async Task<Result> DeleteAsync(int id, int userId)
        {
            var assignment = await _assignmentRepository.GetByIdAsync(id);

            if (assignment == null)
            {
                throw new NotFoundException("Assignment", id);
            }

            // Get current user to check role
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new NotFoundException("User", userId);
            }

            // Admin can delete any assignment
            // Instructor can only delete their own class assignments
            if (user.Role == Domain.Enums.UserRole.Instructor && assignment.Class.InstructorId != userId)
            {
                throw new UnauthorizedException("Only the class instructor can delete this assignment");
            }

            await _assignmentRepository.DeleteAsync(assignment);
            await _assignmentRepository.SaveChangesAsync();

            return Result.Success("Assignment deleted successfully");
        }
        public async Task<Result<List<AssignmentResponseDto>>> GetByInstructorIdAsync(int instructorId)
        {
            var classes = await _classRepository.GetByInstructorIdAsync(instructorId);
            var classIds = classes.Select(c => c.Id).ToList();

            if (!classIds.Any())
            {
                return Result<List<AssignmentResponseDto>>.Success(new List<AssignmentResponseDto>());
            }

            // Bu class'lara ait tüm assignments'ları getir
            var assignments = await _assignmentRepository.GetByClassIdsAsync(classIds);

            var response = assignments.Select(a => new AssignmentResponseDto
            {
                Id = a.Id,
                Title = a.Title,
                Description = a.Description,
                ClassName = a.Class.ClassName,
                ClassId = a.ClassId,
                AssignmentType = a.Type.ToString(),
                Type = a.Type.ToString(),
                DueDate = a.DueDate,
                MaxScore = a.MaxScore,
                AllowLateSubmission = a.AllowLateSubmission,
                AllowResubmission = a.AllowResubmission,
                AttachmentPath = a.AttachmentPath,
                TotalSubmissions = a.Submissions.Count,
                InstructorId = a.Class.InstructorId,
                CreatedAt = a.CreatedAt
            }).ToList();

            return Result<List<AssignmentResponseDto>>.Success(response);

        }
    }
}
