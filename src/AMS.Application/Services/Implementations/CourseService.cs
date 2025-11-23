using AMS.Application.Common.Exceptions;
using AMS.Application.Common.Results;
using AMS.Application.DTOs.Course;
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

        public CourseService(ICourseRepository courseRepository)
        {
            _courseRepository = courseRepository;
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
    }
}
