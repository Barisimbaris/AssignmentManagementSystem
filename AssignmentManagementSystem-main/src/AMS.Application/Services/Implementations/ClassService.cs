using AMS.Application.Common.Exceptions;
using AMS.Application.Common.Results;
using AMS.Application.DTOs.Class;
using AMS.Application.DTOs.User;
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
    public class ClassService : IClassService
    {
        private readonly IClassRepository _classRepository;
        private readonly ICourseRepository _courseRepository;
        private readonly IUserRepository _userRepository;
        private readonly IEnrollmentRepository _enrollmentRepository;
        private readonly ICourseInstructorRepository _courseInstructorRepository;
        private readonly INotificationService _notificationService; // ✅ YENİ

        public ClassService(
            IClassRepository classRepository,
            ICourseRepository courseRepository,
            IUserRepository userRepository,
            IEnrollmentRepository enrollmentRepository,
            ICourseInstructorRepository courseInstructorRepository,
            INotificationService notificationService) // ✅ YENİ
        {
            _classRepository = classRepository;
            _courseRepository = courseRepository;
            _userRepository = userRepository;
            _enrollmentRepository = enrollmentRepository;
            _courseInstructorRepository = courseInstructorRepository;
            _notificationService = notificationService; // ✅ YENİ
        }

        public async Task<Result<ClassResponseDto>> GetByIdAsync(int id)
        {
            var classEntity = await _classRepository.GetByIdAsync(id);

            if (classEntity == null)
            {
                throw new NotFoundException("Class", id);
            }

            var enrollmentCount = await _enrollmentRepository.GetEnrollmentCountByClassIdAsync(id);

            var response = new ClassResponseDto
            {
                Id = classEntity.Id,
                CourseId = classEntity.CourseId,
                CourseName = classEntity.Course?.CourseName ?? string.Empty,
                CourseCode = classEntity.Course?.CourseCode ?? string.Empty,
                ClassName = classEntity.ClassName,
                ClassCode = classEntity.ClassCode,
                InstructorId = classEntity.InstructorId,
                InstructorName = $"{classEntity.Instructor?.FirstName ?? ""} {classEntity.Instructor?.LastName ?? ""}".Trim(),
                MaxCapacity = classEntity.MaxCapacity,
                CurrentEnrollment = enrollmentCount,
                Semester = classEntity.Semester,
                CreatedAt = classEntity.CreatedAt
            };

            return Result<ClassResponseDto>.Success(response);
        }

        public async Task<Result<List<ClassResponseDto>>> GetAllAsync()
        {
            var classes = await _classRepository.GetAllAsync();

            var response = new List<ClassResponseDto>();

            foreach (var c in classes)
            {
                var enrollmentCount = await _enrollmentRepository.GetEnrollmentCountByClassIdAsync(c.Id);

                response.Add(new ClassResponseDto
                {
                    Id = c.Id,
                    CourseId = c.CourseId,
                    CourseName = c.Course?.CourseName ?? string.Empty,
                    CourseCode = c.Course?.CourseCode ?? string.Empty,
                    ClassName = c.ClassName,
                    ClassCode = c.ClassCode,
                    InstructorId = c.InstructorId,
                    InstructorName = $"{c.Instructor?.FirstName ?? ""} {c.Instructor?.LastName ?? ""}".Trim(),
                    MaxCapacity = c.MaxCapacity,
                    CurrentEnrollment = enrollmentCount,
                    Semester = c.Semester,
                    CreatedAt = c.CreatedAt
                });
            }

            return Result<List<ClassResponseDto>>.Success(response);
        }

        public async Task<Result<List<ClassResponseDto>>> GetByCourseIdAsync(int courseId)
        {
            var classes = await _classRepository.GetByCourseIdAsync(courseId);

            var response = new List<ClassResponseDto>();

            foreach (var c in classes)
            {
                var enrollmentCount = await _enrollmentRepository.GetEnrollmentCountByClassIdAsync(c.Id);

                response.Add(new ClassResponseDto
                {
                    Id = c.Id,
                    CourseId = c.CourseId,
                    CourseName = c.Course?.CourseName ?? "",
                    CourseCode = c.Course?.CourseCode ?? "",
                    ClassName = c.ClassName,
                    ClassCode = c.ClassCode,
                    InstructorId = c.InstructorId,
                    InstructorName = $"{c.Instructor.FirstName} {c.Instructor.LastName}",
                    MaxCapacity = c.MaxCapacity,
                    CurrentEnrollment = enrollmentCount,
                    Semester = c.Semester,
                    CreatedAt = c.CreatedAt
                });
            }

            return Result<List<ClassResponseDto>>.Success(response);
        }

        public async Task<Result<List<ClassResponseDto>>> GetByInstructorIdAsync(int instructorId)
        {
            var classes = await _classRepository.GetByInstructorIdAsync(instructorId);

            var response = new List<ClassResponseDto>();

            foreach (var c in classes)
            {
                var enrollmentCount = await _enrollmentRepository.GetEnrollmentCountByClassIdAsync(c.Id);

                response.Add(new ClassResponseDto
                {
                    Id = c.Id,
                    CourseId = c.CourseId,
                    CourseName = c.Course?.CourseName ?? string.Empty,
                    CourseCode = c.Course?.CourseCode ?? string.Empty,
                    ClassName = c.ClassName,
                    ClassCode = c.ClassCode,
                    InstructorId = c.InstructorId,
                    InstructorName = $"{c.Instructor?.FirstName ?? ""} {c.Instructor?.LastName ?? ""}".Trim(),
                    MaxCapacity = c.MaxCapacity,
                    CurrentEnrollment = enrollmentCount,
                    Semester = c.Semester,
                    CreatedAt = c.CreatedAt
                });
            }

            return Result<List<ClassResponseDto>>.Success(response);
        }

        public async Task<Result<List<ClassResponseDto>>> GetByStudentIdAsync(int studentId)
        {
            // Öğrencinin enrollment'larını al
            var enrollments = await _enrollmentRepository.GetByStudentIdAsync(studentId);
            
            // Sadece aktif ve silinmemiş enrollment'ları filtrele
            var activeEnrollments = enrollments
                .Where(e => e.IsActive && !e.IsDeleted)
                .ToList();
            
            if (!activeEnrollments.Any())
            {
                return Result<List<ClassResponseDto>>.Success(new List<ClassResponseDto>());
            }
            
            var response = new List<ClassResponseDto>();
            
            foreach (var enrollment in activeEnrollments)
            {
                // Class'ı getir
                var classEntity = await _classRepository.GetByIdAsync(enrollment.ClassId);
                
                if (classEntity == null || classEntity.IsDeleted)
                {
                    continue; // Silinmiş class'ları atla
                }
                
                var enrollmentCount = await _enrollmentRepository.GetEnrollmentCountByClassIdAsync(classEntity.Id);
                
                response.Add(new ClassResponseDto
                {
                    Id = classEntity.Id,
                    CourseId = classEntity.CourseId,
                    CourseName = classEntity.Course?.CourseName ?? string.Empty,
                    CourseCode = classEntity.Course?.CourseCode ?? string.Empty,
                    ClassName = classEntity.ClassName,
                    ClassCode = classEntity.ClassCode,
                    InstructorId = classEntity.InstructorId,
                    InstructorName = $"{classEntity.Instructor?.FirstName ?? ""} {classEntity.Instructor?.LastName ?? ""}".Trim(),
                    MaxCapacity = classEntity.MaxCapacity,
                    CurrentEnrollment = enrollmentCount,
                    Semester = classEntity.Semester,
                    CreatedAt = classEntity.CreatedAt
                });
            }
            
            return Result<List<ClassResponseDto>>.Success(response);
        }

        public async Task<Result<ClassResponseDto>> CreateAsync(CreateClassRequestDto request,
    int instructorId)
        {
            var isAssigned = await _courseInstructorRepository.IsAssignedAsync(request.CourseId, instructorId);
            var course = await _courseRepository.GetByIdAsync(request.CourseId);
            if (course == null)
            {
                throw new NotFoundException("Course", request.CourseId);
            }

            var instructor = await _userRepository.GetByIdAsync(instructorId);
            if (instructor == null)
            {
                throw new NotFoundException("Instructor", instructorId);
            }

            var classEntity = new Class
            {
                CourseId = request.CourseId,
                ClassName = request.ClassName,
                ClassCode = request.ClassCode,
                InstructorId = instructorId,
                MaxCapacity = request.MaxCapacity,
                Semester = request.Semester,
                CreatedAt = DateTime.UtcNow
            };

            await _classRepository.AddAsync(classEntity);
            await _classRepository.SaveChangesAsync();

            var response = new ClassResponseDto
            {
                Id = classEntity.Id,
                CourseId = classEntity.CourseId,
                CourseName = course.CourseName,
                CourseCode = course.CourseCode,
                ClassName = classEntity.ClassName,
                ClassCode = classEntity.ClassCode,
                InstructorId = classEntity.InstructorId,
                InstructorName = $"{instructor.FirstName} {instructor.LastName}",
                MaxCapacity = classEntity.MaxCapacity,
                CurrentEnrollment = 0,
                Semester = classEntity.Semester,
                CreatedAt = classEntity.CreatedAt
            };

            return Result<ClassResponseDto>.Success(response, "Class created successfully");
        }

        public async Task<Result<ClassResponseDto>> UpdateAsync(int id, UpdateClassRequestDto request)
        {
            var classEntity = await _classRepository.GetByIdAsync(id);

            if (classEntity == null)
            {
                throw new NotFoundException("Class", id);
            }

            if (!string.IsNullOrEmpty(request.ClassName))
                classEntity.ClassName = request.ClassName;

            if (request.MaxCapacity.HasValue)
                classEntity.MaxCapacity = request.MaxCapacity.Value;

            if (request.InstructorId.HasValue)
            {
                var instructor = await _userRepository.GetByIdAsync(request.InstructorId.Value);
                if (instructor == null)
                {
                    throw new NotFoundException("Instructor", request.InstructorId.Value);
                }
                classEntity.InstructorId = request.InstructorId.Value;
            }

            classEntity.UpdatedAt = DateTime.UtcNow;

            await _classRepository.UpdateAsync(classEntity);
            await _classRepository.SaveChangesAsync();

            var updated = await _classRepository.GetByIdAsync(id);
            var enrollmentCount = await _enrollmentRepository.GetEnrollmentCountByClassIdAsync(id);

            var response = new ClassResponseDto
            {
                Id = updated!.Id,
                CourseId = updated.CourseId,
                CourseName = updated.Course.CourseName,
                CourseCode = updated.Course.CourseCode,
                ClassName = updated.ClassName,
                ClassCode = updated.ClassCode,
                InstructorId = updated.InstructorId,
                InstructorName = $"{updated.Instructor.FirstName} {updated.Instructor.LastName}",
                MaxCapacity = updated.MaxCapacity,
                CurrentEnrollment = enrollmentCount,
                Semester = updated.Semester,
                CreatedAt = updated.CreatedAt
            };

            return Result<ClassResponseDto>.Success(response, "Class updated successfully");
        }

        public async Task<Result> DeleteAsync(int id)
        {
            var classEntity = await _classRepository.GetByIdAsync(id);

            if (classEntity == null)
            {
                throw new NotFoundException("Class", id);
            }

            await _classRepository.DeleteAsync(classEntity);
            await _classRepository.SaveChangesAsync();

            return Result.Success("Class deleted successfully");
        }

        public async Task<Result> EnrollStudentAsync(int classId, int studentId)
        {
            var classEntity = await _classRepository.GetByIdAsync(classId);
            if (classEntity == null)
            {
                throw new NotFoundException("Class", classId);
            }

            var student = await _userRepository.GetByIdAsync(studentId);
            if (student == null)
            {
                throw new NotFoundException("Student", studentId);
            }

            // Önce aktif kayıt var mı kontrol et
            if (await _enrollmentRepository.IsStudentEnrolledAsync(studentId, classId))
            {
                return Result.Failure("Student is already enrolled in this class");
            }

            // Silinmiş (IsDeleted=true) kayıt var mı kontrol et - varsa geri aktif et
            var existingEnrollment = await _enrollmentRepository.GetByStudentAndClassAsync(studentId, classId);
            if (existingEnrollment != null && existingEnrollment.IsDeleted)
            {
                // Silinmiş kaydı geri aktif et
                existingEnrollment.IsDeleted = false;
                existingEnrollment.IsActive = true;
                existingEnrollment.EnrollmentDate = DateTime.UtcNow;
                existingEnrollment.UpdatedAt = DateTime.UtcNow;
                
                await _enrollmentRepository.UpdateAsync(existingEnrollment);
                await _enrollmentRepository.SaveChangesAsync();

                // ✅ YENİ: Enrollment email notification gönder
                await _notificationService.CreateAndSendEnrollmentNotificationAsync(classId, studentId);

                return Result.Success("Student re-enrolled successfully");
            }

            var currentEnrollment = await _enrollmentRepository.GetEnrollmentCountByClassIdAsync(classId);
            if (currentEnrollment >= classEntity.MaxCapacity)
            {
                return Result.Failure("Class is full");
            }

            // Yeni kayıt oluştur
            var enrollment = new Enrollment
            {
                StudentId = studentId,
                ClassId = classId,
                EnrollmentDate = DateTime.UtcNow,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            };

            await _enrollmentRepository.AddAsync(enrollment);
            await _enrollmentRepository.SaveChangesAsync();

            // ✅ YENİ: Enrollment email notification gönder
            await _notificationService.CreateAndSendEnrollmentNotificationAsync(classId, studentId);

            return Result.Success("Student enrolled successfully");
        }

        public async Task<Result> UnenrollStudentAsync(int classId, int studentId)
        {
            // Sadece aktif kayıtları getir (silinmiş kayıtları değil)
            var enrollment = await _enrollmentRepository.GetActiveEnrollmentByStudentAndClassAsync(studentId, classId);

            if (enrollment == null)
            {
                return Result.Failure("Enrollment not found or student is already unenrolled");
            }

            await _enrollmentRepository.DeleteAsync(enrollment);
            await _enrollmentRepository.SaveChangesAsync();

            return Result.Success("Student unenrolled successfully");
        }

        public async Task<Result<List<UserResponseDto>>> GetClassStudentsAsync(int classId)
        {
            var enrollments = await _enrollmentRepository.GetByClassIdAsync(classId);
            
            var students = new List<UserResponseDto>();
            foreach (var enrollment in enrollments)
            {
                if (enrollment.Student != null)
                {
                    students.Add(new UserResponseDto
                    {
                        Id = enrollment.Student.Id,
                        FirstName = enrollment.Student.FirstName,
                        LastName = enrollment.Student.LastName,
                        Email = enrollment.Student.Email,
                        StudentNumber = enrollment.Student.StudentNumber,
                        Department = enrollment.Student.Department,
                        Role = enrollment.Student.Role.ToString(),
                    });
                }
            }

            return Result<List<UserResponseDto>>.Success(students);
        }
    }
}
