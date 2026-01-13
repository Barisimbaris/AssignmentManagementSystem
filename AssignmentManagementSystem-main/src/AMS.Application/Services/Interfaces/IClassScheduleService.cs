using AMS.Application.Common.Results;
using AMS.Application.DTOs.ClassSchedule;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AMS.Application.Services.Interfaces
{
    public interface IClassScheduleService
    {
        Task<Result<ClassScheduleResponseDto>> GetByIdAsync(int id);
        Task<Result<List<ClassScheduleResponseDto>>> GetByClassIdAsync(int classId);
        Task<Result<List<ClassScheduleResponseDto>>> GetByInstructorIdAsync(int instructorId);
        Task<Result<ClassScheduleResponseDto>> CreateAsync(CreateClassScheduleRequestDto request, int instructorId);
        Task<Result<ClassScheduleResponseDto>> UpdateAsync(int id, UpdateClassScheduleRequestDto request, int instructorId);
        Task<Result> DeleteAsync(int id, int instructorId);
        Task<Result<List<ClassScheduleResponseDto>>> GetWeeklyScheduleAsync(int classId);
    }
}
