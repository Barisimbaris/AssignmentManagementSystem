using AMS.Application.Common.Exceptions;
using AMS.Application.Common.Results;
using AMS.Application.DTOs.Course;
using AMS.Application.DTOs.CourseInstructor;
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
    public class CourseService : ICourseService
    {
        private readonly ICourseRepository _courseRepository;
        private readonly ICourseInstructorRepository _courseInstructorRepository;  // ✅ EKLE
        private readonly IUserRepository _userRepository;
        public CourseService(ICourseRepository courseRepository,
            ICourseInstructorRepository courseInstructorRepository,
            IUserRepository userRepository)
        {
            _courseRepository = courseRepository;
            _courseInstructorRepository = courseInstructorRepository;  // ✅ EKLE
            _userRepository = userRepository;
        }

        public async Task<Result<CourseResponseDto>> GetByIdAsync(int id)
        {
            var course = await _courseRepository.GetByIdAsync(id);

            if (course == null)
            {
                throw new NotFoundException("Course", id);
            }

            var response = new CourseResponseDto
            {
                Id = course.Id,
                CourseCode = course.CourseCode,
                CourseName = course.CourseName,
                Description = course.Description,
                Department = course.Department,
                CreditHours = course.CreditHours,
                AcademicYear = course.AcademicYear,
                CreatedAt = course.CreatedAt
            };

            return Result<CourseResponseDto>.Success(response);
        }

        public async Task<Result<List<CourseResponseDto>>> GetAllAsync()
        {
            var courses = await _courseRepository.GetAllAsync();

            var response = courses.Select(c => new CourseResponseDto
            {
                Id = c.Id,
                CourseCode = c.CourseCode,
                CourseName = c.CourseName,
                Description = c.Description,
                Department = c.Department,
                CreditHours = c.CreditHours,
                AcademicYear = c.AcademicYear,
                CreatedAt = c.CreatedAt
            }).ToList();

            return Result<List<CourseResponseDto>>.Success(response);
        }

        public async Task<Result<List<CourseResponseDto>>> GetByDepartmentAsync(string department)
        {
            var courses = await _courseRepository.GetByDepartmentAsync(department);

            var response = courses.Select(c => new CourseResponseDto
            {
                Id = c.Id,
                CourseCode = c.CourseCode,
                CourseName = c.CourseName,
                Description = c.Description,
                Department = c.Department,
                CreditHours = c.CreditHours,
                AcademicYear = c.AcademicYear,
                CreatedAt = c.CreatedAt
            }).ToList();

            return Result<List<CourseResponseDto>>.Success(response);
        }

        public async Task<Result<CourseResponseDto>> CreateAsync(CreateCourseRequestDto request)
        {
            if (await _courseRepository.CourseCodeExistsAsync(request.CourseCode))
            {
                return Result<CourseResponseDto>.Failure("Course code already exists");
            }

            var course = new Course
            {
                CourseCode = request.CourseCode,
                CourseName = request.CourseName,
                Description = request.Description,
                Department = request.Department,
                CreditHours = request.CreditHours,
                AcademicYear = request.AcademicYear,
                CreatedAt = DateTime.UtcNow
            };

            await _courseRepository.AddAsync(course);
            await _courseRepository.SaveChangesAsync();

            var response = new CourseResponseDto
            {
                Id = course.Id,
                CourseCode = course.CourseCode,
                CourseName = course.CourseName,
                Description = course.Description,
                Department = course.Department,
                CreditHours = course.CreditHours,
                AcademicYear = course.AcademicYear,
                CreatedAt = course.CreatedAt
            };

            return Result<CourseResponseDto>.Success(response, "Course created successfully");
        }

        public async Task<Result<CourseResponseDto>> UpdateAsync(int id, UpdateCourseRequestDto request)
        {
            var course = await _courseRepository.GetByIdAsync(id);

            if (course == null)
            {
                throw new NotFoundException("Course", id);
            }

            if (!string.IsNullOrEmpty(request.CourseName))
                course.CourseName = request.CourseName;

            if (!string.IsNullOrEmpty(request.Description))
                course.Description = request.Description;

            if (request.CreditHours.HasValue)
                course.CreditHours = request.CreditHours.Value;

            course.UpdatedAt = DateTime.UtcNow;

            await _courseRepository.UpdateAsync(course);
            await _courseRepository.SaveChangesAsync();

            var response = new CourseResponseDto
            {
                Id = course.Id,
                CourseCode = course.CourseCode,
                CourseName = course.CourseName,
                Description = course.Description,
                Department = course.Department,
                CreditHours = course.CreditHours,
                AcademicYear = course.AcademicYear,
                CreatedAt = course.CreatedAt
            };

            return Result<CourseResponseDto>.Success(response, "Course updated successfully");
        }

        public async Task<Result> DeleteAsync(int id)
        {
            var course = await _courseRepository.GetByIdAsync(id);

            if (course == null)
            {
                throw new NotFoundException("Course", id);
            }

            await _courseRepository.DeleteAsync(course);
            await _courseRepository.SaveChangesAsync();

            return Result.Success("Course deleted successfully");
        }
        public async Task<Result> AssignInstructorAsync(int courseId, int instructorId, string academicYear)
        {
            // Course var mı?
            var course = await _courseRepository.GetByIdAsync(courseId);
            if (course == null)
            {
                return Result.Failure("Course not found");
            }

            // Instructor var mı ve Instructor role'ü var mı?
            var instructor = await _userRepository.GetByIdAsync(instructorId);
            if (instructor == null || instructor.Role != Domain.Enums.UserRole.Instructor)
            {
                return Result.Failure("Invalid instructor");
            }

            // Zaten atanmış mı?
            var existing = await _courseInstructorRepository
                .GetByCourseAndInstructorAsync(courseId, instructorId);
            if (existing != null)
            {
                return Result.Failure("Instructor is already assigned to this course");
            }

            // Atama yap
            var courseInstructor = new Domain.Entities.CourseInstructor
            {
                CourseId = courseId,
                InstructorId = instructorId,
                AcademicYear = academicYear,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _courseInstructorRepository.AddAsync(courseInstructor);
            await _courseInstructorRepository.SaveChangesAsync();

            return Result.Success($"Instructor {instructor.FirstName} {instructor.LastName} assigned to {course.CourseName}");
        }

        public async Task<Result> RemoveInstructorAsync(int courseId, int instructorId)
        {
            var courseInstructor = await _courseInstructorRepository
                .GetByCourseAndInstructorAsync(courseId, instructorId);

            if (courseInstructor == null)
            {
                return Result.Failure("Assignment not found");
            }

            await _courseInstructorRepository.DeleteAsync(courseInstructor);
            await _courseInstructorRepository.SaveChangesAsync();

            return Result.Success("Instructor removed from course");
        }

        public async Task<Result<List<CourseInstructorResponseDto>>> GetCourseInstructorsAsync(int courseId)
        {
            var courseInstructors = await _courseInstructorRepository.GetByCourseIdAsync(courseId);

            var response = courseInstructors.Select(ci => new CourseInstructorResponseDto
            {
                Id = ci.Id,
                CourseId = ci.CourseId,
                CourseCode = ci.Course.CourseCode,
                CourseName = ci.Course.CourseName,
                InstructorId = ci.InstructorId,
                InstructorName = $"{ci.Instructor.FirstName} {ci.Instructor.LastName}",
                InstructorEmail = ci.Instructor.Email,
                AcademicYear = ci.AcademicYear,
                IsActive = ci.IsActive,
                CreatedAt = ci.CreatedAt
            }).ToList();

            return Result<List<CourseInstructorResponseDto>>.Success(response);
        }

        public async Task<Result<List<CourseResponseDto>>> GetInstructorCoursesAsync(int instructorId)
        {
            var courseInstructors = await _courseInstructorRepository.GetByInstructorIdAsync(instructorId);

            var response = courseInstructors.Select(ci => new CourseResponseDto
            {
                Id = ci.Course.Id,
                CourseCode = ci.Course.CourseCode,
                CourseName = ci.Course.CourseName,
                Description = ci.Course.Description,
                Department = ci.Course.Department,
                CreditHours = ci.Course.CreditHours,
                AcademicYear = ci.Course.AcademicYear,
                TotalClasses = ci.Course.Classes.Count,
                TotalStudents = ci.Course.Classes.Sum(c => c.Enrollments.Count),
                CreatedAt = ci.Course.CreatedAt
            }).ToList();

            return Result<List<CourseResponseDto>>.Success(response);
        }
    }
}
