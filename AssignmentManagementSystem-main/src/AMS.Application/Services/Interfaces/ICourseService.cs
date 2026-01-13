using AMS.Application.Common.Results;
using AMS.Application.DTOs.Course;
using AMS.Application.DTOs.CourseInstructor;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.Services.Interfaces
{
    public interface ICourseService
    {
        Task<Result<CourseResponseDto>> GetByIdAsync(int id);
        Task<Result<List<CourseResponseDto>>> GetAllAsync();
        Task<Result<List<CourseResponseDto>>> GetByDepartmentAsync(string department);
        Task<Result<CourseResponseDto>> CreateAsync(CreateCourseRequestDto request, int? instructorId = null);
        Task<Result<CourseResponseDto>> UpdateAsync(int id, UpdateCourseRequestDto request);
        Task<Result> DeleteAsync(int id);
        Task<Result> AssignInstructorAsync(int courseId, int instructorId, string academicYear);
        Task<Result> RemoveInstructorAsync(int courseId, int instructorId);
        Task<Result<List<CourseInstructorResponseDto>>> GetCourseInstructorsAsync(int courseId);
        Task<Result<List<CourseResponseDto>>> GetInstructorCoursesAsync(int instructorId);
    }
}
