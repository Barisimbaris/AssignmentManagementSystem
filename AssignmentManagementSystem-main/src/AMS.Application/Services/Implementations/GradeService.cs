using AMS.Application.Common.Exceptions;
using AMS.Application.Common.Results;
using AMS.Application.DTOs.Grade;
using AMS.Application.Services.Interfaces;
using AMS.Domain.Entities;
using AMS.Domain.Interfaces;
using AMS.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.Services.Implementations
{
    public class GradeService : IGradeService
    {
        private readonly IGradeRepository _gradeRepository;
        private readonly ISubmissionRepository _submissionRepository;
        private readonly IUserRepository _userRepository;
        private readonly INotificationService _notificationService; // ✅ YENİ
        private readonly IAssignmentRepository _assignmentRepository;
        private readonly IEnrollmentRepository _enrollmentRepository;

        public GradeService(
            IGradeRepository gradeRepository,
            ISubmissionRepository submissionRepository,
            IUserRepository userRepository,
            INotificationService notificationService, // ✅ YENİ
            IAssignmentRepository assignmentRepository,
            IEnrollmentRepository enrollmentRepository)
        {
            _gradeRepository = gradeRepository;
            _submissionRepository = submissionRepository;
            _userRepository = userRepository;
            _notificationService = notificationService; // ✅ YENİ
            _assignmentRepository = assignmentRepository;
            _enrollmentRepository = enrollmentRepository;
        }

        public async Task<Result<GradeResponseDto>> GetByIdAsync(int id)
        {
            var grade = await _gradeRepository.GetByIdAsync(id);

            if (grade == null)
            {
                throw new NotFoundException("Grade", id);
            }

            var response = new GradeResponseDto
            {
                Id = grade.Id,
                SubmissionId = grade.SubmissionId,
                AssignmentId = grade.Submission?.AssignmentId ?? 0,
                AssignmentTitle = grade.Submission?.Assignment?.Title ?? string.Empty,
                StudentId = grade.Submission?.StudentId ?? 0,
                StudentName = $"{grade.Submission?.Student?.FirstName ?? ""} {grade.Submission?.Student?.LastName ?? ""}".Trim(),
                Score = grade.Score,
                MaxScore = grade.Submission?.Assignment?.MaxScore ?? 0,
                Feedback = grade.Feedback,
                GradedAt = grade.GradedAt,
                InstructorName = $"{grade.Instructor?.FirstName ?? ""} {grade.Instructor?.LastName ?? ""}".Trim(),
                IsPublished = grade.IsPublished,
                CourseCode = grade.Submission?.Assignment?.Class?.Course?.CourseCode,
                CourseName = grade.Submission?.Assignment?.Class?.Course?.CourseName
            };

            return Result<GradeResponseDto>.Success(response);
        }

        public async Task<Result<GradeResponseDto>> GetBySubmissionIdAsync(int submissionId)
        {
            var grade = await _gradeRepository.GetBySubmissionIdAsync(submissionId);

            if (grade == null)
            {
                throw new NotFoundException($"Grade for submission {submissionId} not found");
            }

            var response = new GradeResponseDto
            {
                Id = grade.Id,
                SubmissionId = grade.SubmissionId,
                AssignmentId = grade.Submission?.AssignmentId ?? 0,
                AssignmentTitle = grade.Submission?.Assignment?.Title ?? string.Empty,
                StudentId = grade.Submission?.StudentId ?? 0,
                StudentName = $"{grade.Submission?.Student?.FirstName ?? ""} {grade.Submission?.Student?.LastName ?? ""}".Trim(),
                Score = grade.Score,
                MaxScore = grade.Submission?.Assignment?.MaxScore ?? 0,
                Feedback = grade.Feedback,
                GradedAt = grade.GradedAt,
                InstructorName = $"{grade.Instructor?.FirstName ?? ""} {grade.Instructor?.LastName ?? ""}".Trim(),
                IsPublished = grade.IsPublished,
                CourseCode = grade.Submission?.Assignment?.Class?.Course?.CourseCode,
                CourseName = grade.Submission?.Assignment?.Class?.Course?.CourseName
            };

            return Result<GradeResponseDto>.Success(response);
        }

        public async Task<Result<List<GradeResponseDto>>> GetByStudentIdAsync(int studentId)
        {
            var grades = await _gradeRepository.GetByStudentIdAsync(studentId);

            var response = grades.Select(g => new GradeResponseDto
            {
                Id = g.Id,
                SubmissionId = g.SubmissionId,
                AssignmentId = g.Submission.AssignmentId,
                AssignmentTitle = g.Submission.Assignment.Title,
                StudentId = g.Submission.StudentId,
                StudentName = $"{g.Submission.Student.FirstName} {g.Submission.Student.LastName}",
                Score = g.Score,
                MaxScore = g.Submission.Assignment.MaxScore,
                Feedback = g.Feedback,
                GradedAt = g.GradedAt,
                InstructorName = $"{g.Instructor.FirstName} {g.Instructor.LastName}",
                IsPublished = g.IsPublished,
                CourseCode = g.Submission.Assignment.Class?.Course?.CourseCode,
                CourseName = g.Submission.Assignment.Class?.Course?.CourseName
            }).ToList();

            return Result<List<GradeResponseDto>>.Success(response);
        }

        public async Task<Result<List<GradeResponseDto>>> GetByClassIdAsync(int classId)
        {
            var grades = await _gradeRepository.GetByClassIdAsync(classId);

            var response = grades.Select(g => new GradeResponseDto
            {
                Id = g.Id,
                SubmissionId = g.SubmissionId,
                AssignmentId = g.Submission.AssignmentId,
                AssignmentTitle = g.Submission.Assignment.Title,
                StudentId = g.Submission.StudentId,
                StudentName = $"{g.Submission.Student.FirstName} {g.Submission.Student.LastName}",
                Score = g.Score,
                MaxScore = g.Submission.Assignment.MaxScore,
                Feedback = g.Feedback,
                GradedAt = g.GradedAt,
                InstructorName = $"{g.Instructor.FirstName} {g.Instructor.LastName}",
                IsPublished = g.IsPublished,
                CourseCode = g.Submission.Assignment.Class?.Course?.CourseCode,
                CourseName = g.Submission.Assignment.Class?.Course?.CourseName
            }).ToList();

            return Result<List<GradeResponseDto>>.Success(response);
        }

        public async Task<Result<GradeResponseDto>> CreateAsync(CreateGradeRequestDto request, int instructorId)
        {
            var submission = await _submissionRepository.GetByIdAsync(request.SubmissionId);

            if (submission == null)
            {
                throw new NotFoundException("Submission", request.SubmissionId);
            }

            var existingGrade = await _gradeRepository.GetBySubmissionIdAsync(request.SubmissionId);
            if (existingGrade != null)
            {
                return Result<GradeResponseDto>.Failure("This submission is already graded");
            }

            if (submission.Assignment?.Class?.InstructorId != instructorId)
            {
                throw new UnauthorizedException("Only the class instructor can grade submissions");
            }

            if (request.Score > (submission.Assignment?.MaxScore ?? 0))
            {
                return Result<GradeResponseDto>.Failure($"Score cannot exceed maximum score of {submission.Assignment?.MaxScore ?? 0}");
            }

            var grade = new Grade
            {
                SubmissionId = request.SubmissionId,
                InstructorId = instructorId,
                Score = request.Score,
                Feedback = request.Feedback,
                GradedAt = DateTime.UtcNow,
                IsPublished = request.IsPublished,
                CreatedAt = DateTime.UtcNow,
                // Bazı ortamlarda veritabanı varsayılan değeri güncellenmemiş olabilir.
                // Bu nedenle IsDeleted alanını açıkça false olarak set ediyoruz ki NULL gitmesin.
                IsDeleted = false
            };

            await _gradeRepository.AddAsync(grade);
            await _gradeRepository.SaveChangesAsync();

            // ✅ YENİ: Email notification gönder
            await _notificationService.CreateAndSendGradeNotificationAsync(
                request.SubmissionId, 
                submission.StudentId, 
                (int)request.Score, 
                submission.Assignment.MaxScore
            );

            var instructor = await _userRepository.GetByIdAsync(instructorId);

            var response = new GradeResponseDto
            {
                Id = grade.Id,
                SubmissionId = grade.SubmissionId,
                AssignmentId = submission.AssignmentId,
                AssignmentTitle = submission.Assignment?.Title ?? string.Empty,
                StudentId = submission.StudentId,
                StudentName = $"{submission.Student?.FirstName ?? ""} {submission.Student?.LastName ?? ""}".Trim(),
                Score = grade.Score,
                MaxScore = submission.Assignment?.MaxScore ?? 0,
                Feedback = grade.Feedback,
                GradedAt = grade.GradedAt,
                InstructorName = $"{instructor?.FirstName ?? ""} {instructor?.LastName ?? ""}".Trim(),
                IsPublished = grade.IsPublished,
                CourseCode = submission.Assignment?.Class?.Course?.CourseCode,
                CourseName = submission.Assignment?.Class?.Course?.CourseName
            };

            return Result<GradeResponseDto>.Success(response, "Grade created successfully");
        }

        public async Task<Result<GradeResponseDto>> UpdateAsync(int id, UpdateGradeRequestDto request, int instructorId)
        {
            var grade = await _gradeRepository.GetByIdAsync(id);

            if (grade == null)
            {
                throw new NotFoundException("Grade", id);
            }

            if (grade.InstructorId != instructorId)
            {
                throw new UnauthorizedException("You can only update your own grades");
            }

            if (request.Score.HasValue)
            {
                var maxScore = grade.Submission?.Assignment?.MaxScore ?? 0;
                if (request.Score.Value > maxScore)
                {
                    return Result<GradeResponseDto>.Failure($"Score cannot exceed maximum score of {maxScore}");
                }
                grade.Score = request.Score.Value;
            }

            if (!string.IsNullOrEmpty(request.Feedback))
                grade.Feedback = request.Feedback;

            if (request.IsPublished.HasValue)
                grade.IsPublished = request.IsPublished.Value;

            grade.UpdatedAt = DateTime.UtcNow;

            await _gradeRepository.UpdateAsync(grade);
            await _gradeRepository.SaveChangesAsync();

            var updated = await _gradeRepository.GetByIdAsync(id);

            var response = new GradeResponseDto
            {
                Id = updated!.Id,
                SubmissionId = updated.SubmissionId,
                AssignmentId = updated.Submission.AssignmentId,
                AssignmentTitle = updated.Submission.Assignment.Title,
                StudentId = updated.Submission.StudentId,
                StudentName = $"{updated.Submission.Student.FirstName} {updated.Submission.Student.LastName}",
                Score = updated.Score,
                MaxScore = updated.Submission.Assignment.MaxScore,
                Feedback = updated.Feedback,
                GradedAt = updated.GradedAt,
                InstructorName = $"{updated.Instructor.FirstName} {updated.Instructor.LastName}",
                IsPublished = updated.IsPublished,
                CourseCode = updated.Submission.Assignment.Class?.Course?.CourseCode,
                CourseName = updated.Submission.Assignment.Class?.Course?.CourseName
            };

            return Result<GradeResponseDto>.Success(response, "Grade updated successfully");
        }

        public async Task<Result> PublishGradesAsync(List<int> gradeIds, int instructorId)
        {
            var grades = await _gradeRepository.GetByIdsAsync(gradeIds);

            if (grades.Count != gradeIds.Count)
            {
                return Result.Failure("Some grades were not found");
            }

            foreach (var grade in grades)
            {
                if (grade.InstructorId != instructorId)
                {
                    return Result.Failure("You can only publish your own grades");
                }

                grade.IsPublished = true;
                grade.UpdatedAt = DateTime.UtcNow;
                await _gradeRepository.UpdateAsync(grade);

                // ✅ YENİ: Grade publish edildiğinde email notification gönder
                await _notificationService.CreateAndSendGradeNotificationAsync(
                    grade.SubmissionId,
                    grade.Submission.StudentId,
                    (int)grade.Score,
                    grade.Submission.Assignment.MaxScore
                );
            }

            await _gradeRepository.SaveChangesAsync();

            return Result.Success($"{grades.Count} grade(s) published successfully");
        }

        public async Task<Result> DeleteAsync(int id, int instructorId)
        {
            var grade = await _gradeRepository.GetByIdAsync(id);

            if (grade == null)
            {
                throw new NotFoundException("Grade", id);
            }

            if (grade.InstructorId != instructorId)
            {
                throw new UnauthorizedException("You can only delete your own grades");
            }

            await _gradeRepository.DeleteAsync(grade);
            await _gradeRepository.SaveChangesAsync();

            return Result.Success("Grade deleted successfully");
        }

        /// <summary>
        /// Süresi dolmuş ve teslim edilmeyen ödevler için otomatik 0 notu ver.
        /// - Her öğrenci için, gerçek bir teslim yoksa (dosya yok, boyut 0) otomatik bir Submission ve Grade oluşturulur.
        /// - Bu otomatik submission'lar FilePath = \"\" ve FileSizeInBytes = 0 olduğu için
        ///   istatistiklerde \"gerçek teslim\" olarak sayılmaz; ancak grade 0 olarak not karnesine yansır.
        /// </summary>
        public async Task<Result<int>> AutoGradeLateAssignmentsAsync(int assignmentId, int instructorId)
        {
            var assignment = await _assignmentRepository.GetByIdAsync(assignmentId);
            if (assignment == null)
            {
                throw new NotFoundException("Assignment", assignmentId);
            }

            // Sadece sınıfın hocası veya Admin rolündeki kullanıcı bu işlemi yapabilmeli
            // Rol kontrolü controller'da da yapılacak, burada ekstra güvenlik için sınıf hocasını kontrol ediyoruz.
            if (assignment.Class != null && assignment.Class.InstructorId != instructorId)
            {
                throw new UnauthorizedException("Only the class instructor can auto-grade late assignments");
            }

            // Son teslim tarihi henüz geçmemişse işlem yapma
            if (assignment.DueDate > DateTime.UtcNow)
            {
                return Result<int>.Failure("Assignment due date has not passed yet");
            }

            // Bu sınıftaki tüm kayıtlı öğrencileri al
            var enrollments = await _enrollmentRepository.GetByClassIdAsync(assignment.ClassId);
            if (enrollments == null || enrollments.Count == 0)
            {
                return Result<int>.Success(0, "No enrolled students found for this assignment");
            }

            var studentIds = enrollments
                .Where(e => e.IsActive)
                .Select(e => e.StudentId)
                .Distinct()
                .ToList();

            // Bu assignment için var olan tüm submission'ları al
            var submissions = await _submissionRepository.GetByAssignmentIdAsync(assignmentId);

            // Her öğrenci için kontrol et
            var createdCount = 0;

            foreach (var studentId in studentIds)
            {
                // Bu assignment + öğrenci için mevcut submission var mı?
                var studentSubmissions = submissions
                    .Where(s => s.StudentId == studentId)
                    .ToList();

                // Gerçek teslim var mı? (dosya var ve boyut > 0)
                var hasRealSubmission = studentSubmissions.Any(s =>
                    !string.IsNullOrWhiteSpace(s.FilePath) &&
                    s.FileSizeInBytes > 0 &&
                    s.Status == SubmissionStatus.Submitted);

                if (hasRealSubmission)
                {
                    // Öğrenci gerçekten teslim yapmış; otomatik 0 vermeyelim
                    continue;
                }

                // Zaten bu submission'lar için not verilmiş mi?
                // Eğer öğrenci için herhangi bir Grade varsa (herhangi bir submission'a bağlı), atla
                var hasAnyGrade = studentSubmissions.Any(s => s.Grade != null);
                if (hasAnyGrade)
                {
                    continue;
                }

                // Otomatik 0 için yapay bir submission oluştur
                var autoSubmission = new Submission
                {
                    AssignmentId = assignmentId,
                    StudentId = studentId,
                    GroupId = null,
                    FilePath = string.Empty,
                    FileType = FileType.PDF,
                    FileSizeInBytes = 0,
                    SubmittedAt = DateTime.UtcNow,
                    Status = SubmissionStatus.Late,
                    IsLate = true,
                    Comments = "Otomatik 0 - Süresi doldu ve teslim yapılmadı.",
                    CreatedAt = DateTime.UtcNow,
                    IsDeleted = false
                };

                await _submissionRepository.AddAsync(autoSubmission);
                await _submissionRepository.SaveChangesAsync();

                // Yapay submission için 0 notlu grade oluştur
                var autoGrade = new Grade
                {
                    SubmissionId = autoSubmission.Id,
                    InstructorId = instructorId,
                    Score = 0,
                    Feedback = "Süre doldu, teslim yapılmadığı için otomatik 0 verilmiştir.",
                    GradedAt = DateTime.UtcNow,
                    IsPublished = true,
                    CreatedAt = DateTime.UtcNow,
                    IsDeleted = false
                };

                await _gradeRepository.AddAsync(autoGrade);
                await _gradeRepository.SaveChangesAsync();

                createdCount++;
            }

            return Result<int>.Success(
                createdCount,
                createdCount > 0
                    ? $"{createdCount} öğrenci için otomatik 0 notu verildi."
                    : "Otomatik 0 verilecek öğrenci bulunamadı (ya teslim yapmışlar ya da zaten notlandırılmış).");
        }
    }
}
