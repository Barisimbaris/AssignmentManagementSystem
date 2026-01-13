using AMS.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DashboardController : BaseController
    {
        private readonly IStatisticsService _statisticsService;

        public DashboardController(IStatisticsService statisticsService)
        {
            _statisticsService = statisticsService;
        }

        /// <summary>
        /// Get admin dashboard (Admin only)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("admin")]
        public async Task<IActionResult> GetAdminDashboard()
        {
            var result = await _statisticsService.GetAdminDashboardAsync();
            return Ok(result);
        }

        /// <summary>
        /// Get instructor dashboard (Instructor only)
        /// </summary>
        [Authorize(Roles = "Instructor")]
        [HttpGet("instructor")]
        public async Task<IActionResult> GetInstructorDashboard()
        {
            var instructorId = GetCurrentUserId();
            var result = await _statisticsService.GetInstructorDashboardAsync(instructorId);
            return Ok(result);
        }

        /// <summary>
        /// Get student dashboard (Student only)
        /// </summary>
        [Authorize(Roles = "Student")]
        [HttpGet("student")]
        public async Task<IActionResult> GetStudentDashboard()
        {
            var studentId = GetCurrentUserId();
            var result = await _statisticsService.GetStudentDashboardAsync(studentId);
            return Ok(result);
        }

        /// <summary>
        /// Get course statistics (Admin only)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("statistics/courses")]
        public async Task<IActionResult> GetCourseStatistics()
        {
            var result = await _statisticsService.GetCourseStatisticsAsync();
            return Ok(result);
        }

        /// <summary>
        /// Get department statistics (Admin only)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("statistics/departments")]
        public async Task<IActionResult> GetDepartmentStatistics()
        {
            var result = await _statisticsService.GetDepartmentStatisticsAsync();
            return Ok(result);
        }

        /// <summary>
        /// Get class statistics for instructor
        /// </summary>
        [Authorize(Roles = "Instructor")]
        [HttpGet("statistics/my-classes")]
        public async Task<IActionResult> GetMyClassStatistics()
        {
            var instructorId = GetCurrentUserId();
            var result = await _statisticsService.GetClassStatisticsByInstructorAsync(instructorId);
            return Ok(result);
        }
    }
}