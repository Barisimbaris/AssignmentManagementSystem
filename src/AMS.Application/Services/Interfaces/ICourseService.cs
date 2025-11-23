using AMS.Application.Common.Results;
using AMS.Application.DTOs.Course;
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
        Task<Result<CourseResponseDto>> CreateAsync(CreateCourseRequestDto request);
        Task<Result<CourseResponseDto>> UpdateAsync(int id, UpdateCourseRequestDto request);
        Task<Result> DeleteAsync(int id);
    }
}
