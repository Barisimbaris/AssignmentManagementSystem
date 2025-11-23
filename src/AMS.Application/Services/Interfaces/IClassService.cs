using AMS.Application.Common.Results;
using AMS.Application.DTOs.Class;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.Services.Interfaces
{
    public  interface IClassService
    {
        Task<Result<ClassResponseDto>> GetByIdAsync(int id);
        Task<Result<List<ClassResponseDto>>> GetAllAsync();
        Task<Result<List<ClassResponseDto>>> GetByCourseIdAsync(int courseId);
        Task<Result<List<ClassResponseDto>>> GetByInstructorIdAsync(int instructorId);
        Task<Result<ClassResponseDto>> CreateAsync(CreateClassRequestDto request);
        Task<Result<ClassResponseDto>> UpdateAsync(int id, UpdateClassRequestDto request);
        Task<Result> DeleteAsync(int id);
        Task<Result> EnrollStudentAsync(int classId, int studentId);
        Task<Result> UnenrollStudentAsync(int classId, int studentId);
    }
}
