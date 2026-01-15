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
        private readonly IGroupMemberRepository _groupMemberRepository; // Grup ödevi için

        public GradeService(
            IGradeRepository gradeRepository,
            ISubmissionRepository submissionRepository,
            IUserRepository userRepository,
            INotificationService notificationService, // ✅ YENİ
            IAssignmentRepository assignmentRepository,
            IEnrollmentRepository enrollmentRepository,
            IGroupMemberRepository groupMemberRepository) // Grup ödevi için
        {
            _gradeRepository = gradeRepository;
            _submissionRepository = submissionRepository;
            _userRepository = userRepository;
            _notificationService = notificationService; // ✅ YENİ
            _assignmentRepository = assignmentRepository;
            _enrollmentRepository = enrollmentRepository;
            _groupMemberRepository = groupMemberRepository;
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

            // ✅ LOG: Not verildi
            var instructorUser = await _userRepository.GetByIdAsync(instructorId);
            var studentUser = await _userRepository.GetByIdAsync(submission.StudentId);
            Console.WriteLine($"[GRADE_LOG] Not verildi - Assignment: {submission.Assignment?.Title ?? "Bilinmiyor"} (ID: {submission.AssignmentId}), " +
                $"Öğrenci: {studentUser?.FirstName} {studentUser?.LastName} (ID: {submission.StudentId}), " +
                $"Not: {request.Score}/{submission.Assignment?.MaxScore ?? 0}, " +
                $"Öğretmen: {instructorUser?.FirstName} {instructorUser?.LastName} (ID: {instructorId}), " +
                $"Zaman: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");

            // ✅ Grup ödevi ise: Lidere verilen notu tüm grup üyelerine de ver
            if (submission.Assignment?.Type == AssignmentType.Group && submission.GroupId.HasValue)
            {
                var groupMembers = await _groupMemberRepository.GetGroupMembersAsync(submission.GroupId.Value);
                
                foreach (var member in groupMembers)
                {
                    // Lider zaten notlandırıldı, diğer üyelere de aynı notu ver
                    if (member.StudentId != submission.StudentId)
                    {
                        // Bu üye için submission var mı kontrol et
                        var memberSubmission = await _submissionRepository.GetByAssignmentAndStudentAsync(
                            submission.AssignmentId, 
                            member.StudentId
                        );
                        
                        // Üye için submission yoksa, liderin submission'ına bağlı grade oluştur
                        // (GetByStudentIdAsync'de grup submission'larını gösterdiğimiz için üye de görebilecek)
                        int submissionIdForGrade = submission.Id; // Liderin submission'ı
                        
                        if (memberSubmission != null)
                        {
                            // Üye için submission var, ona grade ver
                            var existingMemberGrade = await _gradeRepository.GetBySubmissionIdAsync(memberSubmission.Id);
                            if (existingMemberGrade == null)
                            {
                                var memberGrade = new Grade
                                {
                                    SubmissionId = memberSubmission.Id,
                                    InstructorId = instructorId,
                                    Score = request.Score,
                                    Feedback = request.Feedback + " (Grup notu - Lider ile aynı)",
                                    GradedAt = DateTime.UtcNow,
                                    IsPublished = request.IsPublished,
                                    CreatedAt = DateTime.UtcNow,
                                    IsDeleted = false
                                };
                                
                                await _gradeRepository.AddAsync(memberGrade);
                            }
                        }
                        else
                        {
                            // Üye için submission yok, liderin submission'ına bağlı grade oluştur
                            // Aynı submission'a birden fazla grade olamaz, bu yüzden üye için de aynı submission'a bağlı grade oluşturamayız
                            // Çözüm: Üye için dummy submission oluştur ve ona grade ver
                            var dummySubmission = new Submission
                            {
                                AssignmentId = submission.AssignmentId,
                                StudentId = member.StudentId,
                                GroupId = submission.GroupId,
                                FilePath = submission.FilePath, // Liderin dosyası
                                FileType = submission.FileType,
                                FileSizeInBytes = submission.FileSizeInBytes,
                                SubmittedAt = submission.SubmittedAt,
                                Status = submission.Status,
                                IsLate = submission.IsLate,
                                Comments = submission.Comments + " (Grup submission - Lider tarafından teslim edildi)",
                                CreatedAt = DateTime.UtcNow,
                                IsDeleted = false
                            };
                            
                            await _submissionRepository.AddAsync(dummySubmission);
                            await _submissionRepository.SaveChangesAsync();
                            
                            // Üye için grade oluştur
                            var memberGrade = new Grade
                            {
                                SubmissionId = dummySubmission.Id,
                                InstructorId = instructorId,
                                Score = request.Score,
                                Feedback = request.Feedback + " (Grup notu - Lider ile aynı)",
                                GradedAt = DateTime.UtcNow,
                                IsPublished = request.IsPublished,
                                CreatedAt = DateTime.UtcNow,
                                IsDeleted = false
                            };
                            
                            await _gradeRepository.AddAsync(memberGrade);
                            
                            // ✅ LOG: Grup üyesine not verildi
                            var memberUser = await _userRepository.GetByIdAsync(member.StudentId);
                            Console.WriteLine($"[GRADE_LOG] Grup üyesine not verildi - Assignment: {submission.Assignment?.Title ?? "Bilinmiyor"} (ID: {submission.AssignmentId}), " +
                                $"Grup: {submission.GroupId}, " +
                                $"Üye: {memberUser?.FirstName} {memberUser?.LastName} (ID: {member.StudentId}), " +
                                $"Not: {request.Score}/{submission.Assignment?.MaxScore ?? 0} (Grup notu - Lider ile aynı), " +
                                $"Öğretmen: {instructorUser?.FirstName} {instructorUser?.LastName} (ID: {instructorId}), " +
                                $"Zaman: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
                        }
                    }
                }
                
                await _gradeRepository.SaveChangesAsync();
            }

            // ✅ YENİ: Email notification gönder
            await _notificationService.CreateAndSendGradeNotificationAsync(
                request.SubmissionId, 
                submission.StudentId, 
                (int)request.Score, 
                submission.Assignment?.MaxScore ?? 0
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

            // ✅ Grup ödevi ise: Güncellenen notu tüm grup üyelerine de uygula
            var submission = grade.Submission;
            if (submission?.Assignment?.Type == AssignmentType.Group && submission.GroupId.HasValue)
            {
                var groupMembers = await _groupMemberRepository.GetGroupMembersAsync(submission.GroupId.Value);
                var instructorUser = await _userRepository.GetByIdAsync(instructorId);
                
                foreach (var member in groupMembers)
                {
                    // Lider zaten güncellendi, diğer üyelere de aynı güncellemeyi uygula
                    if (member.StudentId != submission.StudentId)
                    {
                        // Bu üye için submission var mı kontrol et
                        var memberSubmission = await _submissionRepository.GetByAssignmentAndStudentAsync(
                            submission.AssignmentId, 
                            member.StudentId
                        );
                        
                        if (memberSubmission != null)
                        {
                            // Üye için submission var, grade'i güncelle veya oluştur
                            var existingMemberGrade = await _gradeRepository.GetBySubmissionIdAsync(memberSubmission.Id);
                            
                            if (existingMemberGrade != null)
                            {
                                // Mevcut grade'i güncelle
                                if (request.Score.HasValue)
                                {
                                    existingMemberGrade.Score = request.Score.Value;
                                }
                                
                                if (!string.IsNullOrEmpty(request.Feedback))
                                {
                                    // Feedback'e grup notu olduğunu belirt (eğer yoksa ekle)
                                    var feedbackText = request.Feedback;
                                    if (!feedbackText.Contains("Grup notu"))
                                    {
                                        feedbackText = feedbackText + " (Grup notu - Lider ile aynı)";
                                    }
                                    existingMemberGrade.Feedback = feedbackText;
                                }
                                
                                if (request.IsPublished.HasValue)
                                {
                                    existingMemberGrade.IsPublished = request.IsPublished.Value;
                                }
                                
                                existingMemberGrade.UpdatedAt = DateTime.UtcNow;
                                
                                await _gradeRepository.UpdateAsync(existingMemberGrade);
                                
                                // ✅ LOG: Grup üyesinin notu güncellendi
                                var memberUser = await _userRepository.GetByIdAsync(member.StudentId);
                                Console.WriteLine($"[GRADE_LOG] Grup üyesinin notu güncellendi - Assignment: {submission.Assignment?.Title ?? "Bilinmiyor"} (ID: {submission.AssignmentId}), " +
                                    $"Grup: {submission.GroupId}, " +
                                    $"Üye: {memberUser?.FirstName} {memberUser?.LastName} (ID: {member.StudentId}), " +
                                    $"Not: {existingMemberGrade.Score}/{submission.Assignment?.MaxScore ?? 0} (Grup notu - Lider ile aynı), " +
                                    $"Öğretmen: {instructorUser?.FirstName} {instructorUser?.LastName} (ID: {instructorId}), " +
                                    $"Zaman: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
                            }
                            else
                            {
                                // Üye için grade yok, yeni grade oluştur
                                var memberGrade = new Grade
                                {
                                    SubmissionId = memberSubmission.Id,
                                    InstructorId = instructorId,
                                    Score = request.Score ?? grade.Score,
                                    Feedback = (!string.IsNullOrEmpty(request.Feedback) ? request.Feedback : grade.Feedback) + " (Grup notu - Lider ile aynı)",
                                    GradedAt = DateTime.UtcNow,
                                    IsPublished = request.IsPublished ?? grade.IsPublished,
                                    CreatedAt = DateTime.UtcNow,
                                    IsDeleted = false
                                };
                                
                                await _gradeRepository.AddAsync(memberGrade);
                                
                                // ✅ LOG: Grup üyesine not verildi (güncelleme sırasında)
                                var memberUser = await _userRepository.GetByIdAsync(member.StudentId);
                                Console.WriteLine($"[GRADE_LOG] Grup üyesine not verildi (güncelleme) - Assignment: {submission.Assignment?.Title ?? "Bilinmiyor"} (ID: {submission.AssignmentId}), " +
                                    $"Grup: {submission.GroupId}, " +
                                    $"Üye: {memberUser?.FirstName} {memberUser?.LastName} (ID: {member.StudentId}), " +
                                    $"Not: {memberGrade.Score}/{submission.Assignment?.MaxScore ?? 0} (Grup notu - Lider ile aynı), " +
                                    $"Öğretmen: {instructorUser?.FirstName} {instructorUser?.LastName} (ID: {instructorId}), " +
                                    $"Zaman: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
                            }
                        }
                        else
                        {
                            // Üye için submission yok - CreateAsync'de dummy submission oluşturulmuş olmalı
                            // Eğer CreateAsync'de oluşturulmamışsa, burada da oluşturmayalım (tutarlılık için)
                            // Bu durumda üye için grade güncellenemez, ancak bu normal bir durum değil
                            // Çünkü CreateAsync'de grup üyeleri için dummy submission oluşturuluyor
                            Console.WriteLine($"[GRADE_LOG] UYARI: Grup üyesi (ID: {member.StudentId}) için submission bulunamadı. " +
                                $"Grup: {submission.GroupId}, Assignment: {submission.AssignmentId}. " +
                                $"Bu durum CreateAsync'de dummy submission oluşturulmamış olabilir.");
                        }
                    }
                }
                
                await _gradeRepository.SaveChangesAsync();
                
                // ✅ LOG: Liderin notu güncellendi ve grup üyelerine uygulandı
                var studentUser = await _userRepository.GetByIdAsync(submission.StudentId);
                Console.WriteLine($"[GRADE_LOG] Grup ödevi notu güncellendi - Assignment: {submission.Assignment?.Title ?? "Bilinmiyor"} (ID: {submission.AssignmentId}), " +
                    $"Grup: {submission.GroupId}, " +
                    $"Lider: {studentUser?.FirstName} {studentUser?.LastName} (ID: {submission.StudentId}), " +
                    $"Not: {grade.Score}/{submission.Assignment?.MaxScore ?? 0}, " +
                    $"Öğretmen: {instructorUser?.FirstName} {instructorUser?.LastName} (ID: {instructorId}), " +
                    $"Zaman: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC - Tüm grup üyelerine uygulandı");
                
                // ✅ YENİ: Grup ödevleri için tüm grup üyelerine notification gönder
                try
                {
                    // Mevcut groupMembers değişkenini kullan (zaten yukarıda tanımlı)
                    foreach (var member in groupMembers)
                    {
                        // Her üye için submission ID'sini bul
                        var memberSubmission = await _submissionRepository.GetByAssignmentAndStudentAsync(
                            submission.AssignmentId, 
                            member.StudentId
                        );
                        
                        if (memberSubmission != null && submission.Assignment != null)
                        {
                            await _notificationService.CreateAndSendGradeNotificationAsync(
                                memberSubmission.Id,
                                member.StudentId,
                                (int)grade.Score,
                                submission.Assignment.MaxScore
                            );
                        }
                    }
                }
                catch (Exception ex)
                {
                    // Log notification error but don't break the update
                    Console.WriteLine($"Failed to send notification for group grade update: {ex.Message}");
                }
            }
            else
            {
                // ✅ LOG: Normal ödev notu güncellendi
                var studentUser = await _userRepository.GetByIdAsync(submission?.StudentId ?? 0);
                var instructorUser = await _userRepository.GetByIdAsync(instructorId);
                Console.WriteLine($"[GRADE_LOG] Not güncellendi - Assignment: {submission?.Assignment?.Title ?? "Bilinmiyor"} (ID: {submission?.AssignmentId ?? 0}), " +
                    $"Öğrenci: {studentUser?.FirstName} {studentUser?.LastName} (ID: {submission?.StudentId ?? 0}), " +
                    $"Not: {grade.Score}/{submission?.Assignment?.MaxScore ?? 0}, " +
                    $"Öğretmen: {instructorUser?.FirstName} {instructorUser?.LastName} (ID: {instructorId}), " +
                    $"Zaman: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
                
                // ✅ YENİ: Normal ödev için öğrenciye notification gönder
                if (submission != null)
                {
                    try
                    {
                        await _notificationService.CreateAndSendGradeNotificationAsync(
                            submission.Id,
                            submission.StudentId,
                            (int)grade.Score,
                            submission.Assignment?.MaxScore ?? 0
                        );
                    }
                    catch (Exception ex)
                    {
                        // Log notification error but don't break the update
                        Console.WriteLine($"Failed to send notification for grade update: {ex.Message}");
                    }
                }
            }

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
