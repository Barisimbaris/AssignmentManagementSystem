using AMS.Application.Common.Exceptions;
using AMS.Application.Common.Results;
using AMS.Application.DTOs.Submission;
using AMS.Application.Services.Interfaces;
using AMS.Domain.Entities;
using AMS.Domain.Enums;
using AMS.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.Services.Implementations
{
    public class SubmissionService : ISubmissionService
    {
        private readonly ISubmissionRepository _submissionRepository;
        private readonly IAssignmentRepository _assignmentRepository;
        private readonly IUserRepository _userRepository;
        private readonly IGroupService _groupService;
        private readonly IGroupMemberRepository _groupMemberRepository; // Grup üyeleri için
        private readonly IEnrollmentRepository _enrollmentRepository; // Öğrencinin class'larını bulmak için

        public SubmissionService(
            ISubmissionRepository submissionRepository,
            IAssignmentRepository assignmentRepository,
            IUserRepository userRepository,
            IGroupService groupService,
            IGroupMemberRepository groupMemberRepository,
            IEnrollmentRepository enrollmentRepository)
        {
            _submissionRepository = submissionRepository;
            _assignmentRepository = assignmentRepository;
            _userRepository = userRepository;
            _groupService = groupService;
            _groupMemberRepository = groupMemberRepository;
            _enrollmentRepository = enrollmentRepository;
        }

        public async Task<Result<SubmissionResponseDto>> GetByIdAsync(int id)
        {
            var submission = await _submissionRepository.GetByIdAsync(id);

            if (submission == null)
            {
                throw new NotFoundException("Submission", id);
            }

            var response = new SubmissionResponseDto
            {
                Id = submission.Id,
                AssignmentId = submission.AssignmentId,
                AssignmentTitle = submission.Assignment.Title,
                StudentId = submission.StudentId,
                StudentName = $"{submission.Student.FirstName} {submission.Student.LastName}",
                FilePath = submission.FilePath,
                FileType = submission.FileType.ToString(),
                FileSizeInBytes = submission.FileSizeInBytes,
                SubmittedAt = submission.SubmittedAt,
                Status = submission.Status.ToString(),
                IsLate = submission.IsLate,
                Comments = submission.Comments,
                Score = submission.Grade?.Score,
                Feedback = submission.Grade?.Feedback
            };

            return Result<SubmissionResponseDto>.Success(response);
        }

        public async Task<Result<List<SubmissionResponseDto>>> GetByAssignmentIdAsync(int assignmentId)
        {
            var submissions = await _submissionRepository.GetByAssignmentIdAsync(assignmentId);

            var response = submissions.Select(s => new SubmissionResponseDto
            {
                Id = s.Id,
                AssignmentId = s.AssignmentId,
                AssignmentTitle = s.Assignment?.Title ?? string.Empty,
                StudentId = s.StudentId,
                StudentName = $"{s.Student?.FirstName ?? ""} {s.Student?.LastName ?? ""}".Trim(),
                FilePath = s.FilePath,
                FileType = s.FileType.ToString(),
                FileSizeInBytes = s.FileSizeInBytes,
                SubmittedAt = s.SubmittedAt,
                Status = s.Status.ToString(),
                IsLate = s.IsLate,
                Comments = s.Comments,
                Score = s.Grade?.Score,
                Feedback = s.Grade?.Feedback
            }).ToList();

            return Result<List<SubmissionResponseDto>>.Success(response);
        }

        public async Task<Result<List<SubmissionResponseDto>>> GetByStudentIdAsync(int studentId)
        {
            var submissions = await _submissionRepository.GetByStudentIdAsync(studentId);
            
            // ✅ Grup ödevleri için: Öğrenci bir grubun üyesiyse, liderin submission'ını da göster
            var groupSubmissions = new List<Submission>();
            
            // ✅ Öğrencinin üye olduğu tüm grupları bul (submission yapmış olsun ya da olmasın)
            // Önce öğrencinin kayıtlı olduğu class'ları bul
            var enrollments = await _enrollmentRepository.GetByStudentIdAsync(studentId);
            var classIds = enrollments
                .Where(e => e.IsActive && !e.IsDeleted)
                .Select(e => e.ClassId)
                .Distinct()
                .ToList();
            
            // Bu class'ların grup assignment'larını bul
            var groupAssignments = new List<Domain.Entities.Assignment>();
            foreach (var classId in classIds)
            {
                var classAssignments = await _assignmentRepository.GetByClassIdAsync(classId);
                var groupAssignmentsInClass = classAssignments
                    .Where(a => a.Type == AssignmentType.Group && !a.IsDeleted)
                    .ToList();
                groupAssignments.AddRange(groupAssignmentsInClass);
            }
            
            // Her grup assignment için öğrencinin grubunu bul
            var studentGroups = new List<Domain.Entities.AssignmentGroup>();
            foreach (var assignment in groupAssignments)
            {
                var studentGroup = await _groupMemberRepository.GetStudentGroupAsync(assignment.Id, studentId);
                if (studentGroup != null)
                {
                    studentGroups.Add(studentGroup);
                }
            }
            
            foreach (var group in studentGroups)
            {
                if (group == null || group.Assignment == null) continue;
                
                // Grup liderini bul
                var leader = group.Members?.FirstOrDefault(m => m.IsLeader);
                if (leader != null && leader.StudentId != studentId)
                {
                    // Liderin submission'ını bul
                    var leaderSubmission = await _submissionRepository.GetByAssignmentAndStudentAsync(
                        group.AssignmentId, 
                        leader.StudentId
                    );
                    
                    if (leaderSubmission != null)
                    {
                        // Liderin submission'ını ekle (öğrenci kendi submission'ı olarak görecek)
                        groupSubmissions.Add(leaderSubmission);
                    }
                }
            }
            
            // Tüm submission'ları birleştir (kendi submission'ları + grup submission'ları)
            // Aynı assignment için hem kendi submission hem grup submission varsa, kendi submission'ı öncelikli
            var allSubmissionsList = new List<Submission>();
            var addedAssignmentIds = new HashSet<int>();
            
            // Önce kendi submission'larını ekle
            foreach (var sub in submissions)
            {
                allSubmissionsList.Add(sub);
                addedAssignmentIds.Add(sub.AssignmentId);
            }
            
            // Sonra grup submission'larını ekle (eğer aynı assignment için kendi submission'ı yoksa)
            foreach (var sub in groupSubmissions)
            {
                if (!addedAssignmentIds.Contains(sub.AssignmentId))
                {
                    allSubmissionsList.Add(sub);
                    addedAssignmentIds.Add(sub.AssignmentId);
                }
            }

            var response = allSubmissionsList.Select(s => new SubmissionResponseDto
            {
                Id = s.Id,
                AssignmentId = s.AssignmentId,
                AssignmentTitle = s.Assignment?.Title ?? string.Empty,
                StudentId = s.StudentId,
                StudentName = $"{s.Student?.FirstName ?? ""} {s.Student?.LastName ?? ""}".Trim(),
                FilePath = s.FilePath,
                FileType = s.FileType.ToString(),
                FileSizeInBytes = s.FileSizeInBytes,
                SubmittedAt = s.SubmittedAt,
                Status = s.Status.ToString(),
                IsLate = s.IsLate,
                Comments = s.Comments,
                Score = s.Grade?.Score,
                Feedback = s.Grade?.Feedback,
                GroupId = s.GroupId // Grup ID'yi de ekle
            }).ToList();

            return Result<List<SubmissionResponseDto>>.Success(response);
        }

        public async Task<Result<SubmissionResponseDto>> SubmitAsync(CreateSubmissionRequestDto request, int studentId, string filePath)
        {
            var assignment = await _assignmentRepository.GetByIdAsync(request.AssignmentId);

            if (assignment == null)
            {
                throw new NotFoundException("Assignment", request.AssignmentId);
            }

            var existingSubmission = await _submissionRepository.GetByAssignmentAndStudentAsync(request.AssignmentId, studentId);

            if (existingSubmission != null && !assignment.AllowResubmission)
            {
                return Result<SubmissionResponseDto>.Failure("Bu ödev için yeniden teslim izni verilmemiştir");
            }

            var isLate = DateTime.UtcNow > assignment.DueDate;

            if (isLate && !assignment.AllowLateSubmission)
            {
                return Result<SubmissionResponseDto>.Failure("Bu ödev için geç teslim izni verilmemiştir");
            }

            // Grup ödevi ise grup lideri kontrolü
            if (assignment.Type == AssignmentType.Group)
            {
                if (!request.GroupId.HasValue)
                {
                    return Result<SubmissionResponseDto>.Failure("Grup ödevleri için grup ID gereklidir");
                }

                var isLeader = await _groupService.IsUserGroupLeaderAsync(request.GroupId.Value, studentId);
                if (!isLeader)
                {
                    return Result<SubmissionResponseDto>.Failure("Grup ödevleri için sadece grup lideri teslim edebilir");
                }
            }

            // ✅ FIX: Dosya yolunu düzelt
            var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "Uploads", filePath);
            var fileInfo = new FileInfo(fullPath);

            var submission = new Submission
            {
                AssignmentId = request.AssignmentId,
                StudentId = studentId,
                GroupId = request.GroupId,
                FilePath = filePath,  // Relative path kaydet
                FileType = GetFileType(fileInfo.Extension),
                FileSizeInBytes = fileInfo.Length,
                SubmittedAt = DateTime.UtcNow,
                Status = SubmissionStatus.Submitted,
                IsLate = isLate,
                Comments = request.Comments,
                CreatedAt = DateTime.UtcNow
            };

            await _submissionRepository.AddAsync(submission);
            await _submissionRepository.SaveChangesAsync();

            // ✅ LOG: Grup ödevi teslim edildi
            if (assignment.Type == AssignmentType.Group && request.GroupId.HasValue)
            {
                var group = await _groupMemberRepository.GetStudentGroupAsync(assignment.Id, studentId);
                var leaderUser = await _userRepository.GetByIdAsync(studentId);
                Console.WriteLine($"[GROUP_LOG] Grup ödevi teslim edildi - Grup: {group?.GroupName ?? "Bilinmiyor"} (ID: {request.GroupId.Value}), " +
                    $"Assignment: {assignment.Title} (ID: {assignment.Id}), " +
                    $"Lider: {leaderUser?.FirstName} {leaderUser?.LastName} (ID: {studentId}), " +
                    $"Dosya: {filePath}, " +
                    $"Zaman: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
            }

            var student = await _userRepository.GetByIdAsync(studentId);

            var response = new SubmissionResponseDto
            {
                Id = submission.Id,
                AssignmentId = submission.AssignmentId,
                AssignmentTitle = assignment.Title,
                StudentId = submission.StudentId,
                StudentName = $"{student!.FirstName} {student.LastName}",
                FilePath = submission.FilePath,
                FileType = submission.FileType.ToString(),
                FileSizeInBytes = submission.FileSizeInBytes,
                SubmittedAt = submission.SubmittedAt,
                Status = submission.Status.ToString(),
                IsLate = submission.IsLate,
                Comments = submission.Comments
            };

            return Result<SubmissionResponseDto>.Success(response, "Submission uploaded successfully");
        }

        public async Task<Result<SubmissionResponseDto>> ResubmitAsync(int submissionId, int studentId, string filePath)
        {
            var submission = await _submissionRepository.GetByIdAsync(submissionId);

            if (submission == null)
            {
                throw new NotFoundException("Submission", submissionId);
            }

            if (submission.StudentId != studentId)
            {
                throw new UnauthorizedException("Sadece kendi teslimlerinizi yeniden teslim edebilirsiniz");
            }

            var assignment = await _assignmentRepository.GetByIdAsync(submission.AssignmentId);

            if (!assignment!.AllowResubmission)
            {
                return Result<SubmissionResponseDto>.Failure("Bu ödev için yeniden teslim izni verilmemiştir");
            }

            // Grup ödevi ise grup lideri kontrolü
            if (assignment.Type == AssignmentType.Group && submission.GroupId.HasValue)
            {
                var isLeader = await _groupService.IsUserGroupLeaderAsync(submission.GroupId.Value, studentId);
                if (!isLeader)
                {
                    return Result<SubmissionResponseDto>.Failure("Grup ödevleri için sadece grup lideri yeniden teslim edebilir");
                }
            }

            var fileInfo = new FileInfo(filePath);

            submission.FilePath = filePath;
            submission.FileType = GetFileType(fileInfo.Extension);
            submission.FileSizeInBytes = fileInfo.Length;
            submission.SubmittedAt = DateTime.UtcNow;
            submission.Status = SubmissionStatus.Resubmitted;
            submission.UpdatedAt = DateTime.UtcNow;

            await _submissionRepository.UpdateAsync(submission);
            await _submissionRepository.SaveChangesAsync();

            var response = new SubmissionResponseDto
            {
                Id = submission.Id,
                AssignmentId = submission.AssignmentId,
                AssignmentTitle = submission.Assignment.Title,
                StudentId = submission.StudentId,
                StudentName = $"{submission.Student.FirstName} {submission.Student.LastName}",
                FilePath = submission.FilePath,
                FileType = submission.FileType.ToString(),
                FileSizeInBytes = submission.FileSizeInBytes,
                SubmittedAt = submission.SubmittedAt,
                Status = submission.Status.ToString(),
                IsLate = submission.IsLate,
                Comments = submission.Comments,
                Score = submission.Grade?.Score,
                Feedback = submission.Grade?.Feedback
            };

            return Result<SubmissionResponseDto>.Success(response, "Resubmission uploaded successfully");
        }

        public async Task<Result> DeleteAsync(int id, int studentId)
        {
            var submission = await _submissionRepository.GetByIdAsync(id);

            if (submission == null)
            {
                throw new NotFoundException("Submission", id);
            }

            if (submission.StudentId != studentId)
            {
                throw new UnauthorizedException("You can only delete your own submissions");
            }

            await _submissionRepository.DeleteAsync(submission);
            await _submissionRepository.SaveChangesAsync();

            return Result.Success("Submission deleted successfully");
        }

        private FileType GetFileType(string extension)
        {
            return extension.ToLower() switch
            {
                ".pdf" => FileType.PDF,
                ".jpg" or ".jpeg" or ".png" or ".gif" => FileType.Image,
                _ => FileType.PDF
            };
        }
    }
}
