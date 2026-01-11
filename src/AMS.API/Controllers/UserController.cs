using AMS.Application.DTOs.User;
using AMS.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : BaseController
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService) {
            _userService = userService;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _userService.GetByIdAsync(id);
            return Ok(result);
        }

        [HttpGet("email/{email}")]
        public async Task<IActionResult> GetByEmail(string email) { 
        var result = await _userService.GetByEmailAsync(email);
            return Ok(result);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAll() {
            var result = await _userService.GetAllAsync();
            return Ok(result);

        }
        [Authorize(Roles = "Instructor,Admin")]
        [HttpGet("students")]
        public async Task<IActionResult> GetStudents() {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            // Admin ve Instructor tüm öğrencileri görebilir (şimdilik)
            var result = await _userService.GetStudentsAsync();
            return Ok(result);
        }

        /// <summary>
        /// Get current user profile
        /// </summary>
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = GetCurrentUserId();
            var result = await _userService.GetByIdAsync(userId);
            return Ok(result);
        }

        /// <summary>
        /// Get all instructors
        /// </summary>
        [HttpGet("instructors")]
        public async Task<IActionResult> GetInstructors()
        {
            var result = await _userService.GetInstructorsAsync();
            return Ok(result);
        }

        /// <summary>
        /// Get my students (Instructor only) - Students enrolled in instructor's classes
        /// </summary>
        [Authorize(Roles = "Instructor")]
        [HttpGet("my-students")]
        public async Task<IActionResult> GetMyStudents()
        {
            var instructorId = GetCurrentUserId();
            var result = await _userService.GetInstructorStudentsAsync(instructorId);
            return Ok(result);
        }

        /// <summary>
        /// Update user profile
        /// </summary>
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateUserRequestDto request)
        {
            var userId = GetCurrentUserId();
            var result = await _userService.UpdateAsync(userId, request);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Delete user (Admin only)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _userService.DeleteAsync(id);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Bulk import users from CSV/Excel (Admin only)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPost("bulk-import")]
        public async Task<IActionResult> BulkImport([FromBody] BulkImportRequestDto request)
        {
            var result = await _userService.BulkImportAsync(request);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Download bulk import template (Admin only)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("bulk-import-template")]
        public IActionResult DownloadTemplate()
        {
            var csvContent = "FirstName,LastName,Email,Password,Role,StudentNumber,Department,PhoneNumber\n" +
                           "Ahmet,Yılmaz,ahmet.yilmaz@example.com,TempPass123,1,20240001,Computer Engineering,+905551234567\n" +
                           "Ayşe,Kaya,ayse.kaya@example.com,TempPass123,1,20240002,Computer Engineering,+905551234568\n" +
                           "Dr. Mehmet,Özkan,mehmet.ozkan@example.com,TempPass123,2,,Computer Engineering,+905551234569";

            var bytes = System.Text.Encoding.UTF8.GetBytes(csvContent);
            return File(bytes, "text/csv", "bulk_user_import_template.csv");
        }
    }
}
