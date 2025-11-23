using AMS.Application.Common.Exceptions;
using AMS.Application.Common.Results;
using AMS.Application.DTOs.Class;
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

        public ClassService(
            IClassRepository classRepository,
            ICourseRepository courseRepository,
            IUserRepository userRepository,
            IEnrollmentRepository enrollmentRepository)
        {
            _classRepository = classRepository;
            _courseRepository = courseRepository;
            _userRepository = userRepository;
            _enrollmentRepository = enrollmentRepository;
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
                CourseName = classEntity.Course.CourseName,
                CourseCode = classEntity.Course.CourseCode,
                ClassName = classEntity.ClassName,
                ClassCode = classEntity.ClassCode,
                InstructorId = classEntity.InstructorId,
                InstructorName = $"{classEntity.Instructor.FirstName} {classEntity.Instructor.LastName}",
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
                    CourseName = c.Course.CourseName,
                    CourseCode = c.Course.CourseCode,
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
                    CourseName = c.Course.CourseName,
                    CourseCode = c.Course.CourseCode,
                    ClassName = c.ClassName,
                    ClassCode = c.ClassCode,
                    InstructorId = c.InstructorId,
                    InstructorName = $"{c.Instructor?.FirstName} {c.Instructor?.LastName}",
                    MaxCapacity = c.MaxCapacity,
                    CurrentEnrollment = enrollmentCount,
                    Semester = c.Semester,
                    CreatedAt = c.CreatedAt
                });
            }

            return Result<List<ClassResponseDto>>.Success(response);
        }

        public async Task<Result<ClassResponseDto>> CreateAsync(CreateClassRequestDto request)
        {
            var course = await _courseRepository.GetByIdAsync(request.CourseId);
            if (course == null)
            {
                throw new NotFoundException("Course", request.CourseId);
            }

            var instructor = await _userRepository.GetByIdAsync(request.InstructorId);
            if (instructor == null)
            {
                throw new NotFoundException("Instructor", request.InstructorId);
            }

            var classEntity = new Class
            {
                CourseId = request.CourseId,
                ClassName = request.ClassName,
                ClassCode = request.ClassCode,
                InstructorId = request.InstructorId,
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

            if (await _enrollmentRepository.IsStudentEnrolledAsync(studentId, classId))
            {
                return Result.Failure("Student is already enrolled in this class");
            }

            var currentEnrollment = await _enrollmentRepository.GetEnrollmentCountByClassIdAsync(classId);
            if (currentEnrollment >= classEntity.MaxCapacity)
            {
                return Result.Failure("Class is full");
            }

            var enrollment = new Enrollment
            {
                StudentId = studentId,
                ClassId = classId,
                EnrollmentDate = DateTime.UtcNow,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _enrollmentRepository.AddAsync(enrollment);
            await _enrollmentRepository.SaveChangesAsync();

            return Result.Success("Student enrolled successfully");
        }

        public async Task<Result> UnenrollStudentAsync(int classId, int studentId)
        {
            var enrollment = await _enrollmentRepository.GetByStudentAndClassAsync(studentId, classId);

            if (enrollment == null)
            {
                return Result.Failure("Enrollment not found");
            }

            await _enrollmentRepository.DeleteAsync(enrollment);
            await _enrollmentRepository.SaveChangesAsync();

            return Result.Success("Student unenrolled successfully");
        }
    }
}
