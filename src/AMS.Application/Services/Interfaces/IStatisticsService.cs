using AMS.Application.Common.Results;
using AMS.Application.DTOs.Statistics;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.Services.Interfaces
{
    public interface IStatisticsService
    {
        Task<Result<AdminDashboardDto>> GetAdminDashboardAsync();
        Task<Result<InstructorDashboardDto>> GetInstructorDashboardAsync(int instructorId);
        Task<Result<StudentDashboardDto>> GetStudentDashboardAsync(int studentId);
        Task<Result<List<CourseStatisticsDto>>> GetCourseStatisticsAsync();
        Task<Result<List<DepartmentStatisticsDto>>> GetDepartmentStatisticsAsync();
        Task<Result<List<ClassStatisticsDto>>> GetClassStatisticsByInstructorAsync(int instructorId);
    }
}