using AMS.Application.Common.Results;
using AMS.Application.DTOs.LessonPlan;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AMS.Application.Services.Interfaces
{
    public interface ILessonPlanService
    {
        Task<Result<LessonPlanResponseDto>> GetByIdAsync(int id);
        Task<Result<List<LessonPlanResponseDto>>> GetByClassIdAsync(int classId);
        Task<Result<List<LessonPlanResponseDto>>> GetByInstructorIdAsync(int instructorId);
        Task<Result<LessonPlanResponseDto>> CreateAsync(CreateLessonPlanRequestDto request, int instructorId);
        Task<Result<LessonPlanResponseDto>> UpdateAsync(int id, UpdateLessonPlanRequestDto request, int instructorId);
        Task<Result> DeleteAsync(int id, int instructorId);
    }
}


