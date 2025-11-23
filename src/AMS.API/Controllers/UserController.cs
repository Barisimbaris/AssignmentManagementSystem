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

        [HttpGet("students")]
        public async Task<IActionResult> GetStudents() { 
        var result = await _userService.GetStudentsAsync();
            return Ok(result);
        }

        [HttpGet("instructors")]
        public async Task<IActionResult> GetInstructors() { 
        var result = await _userService.GetInstructorsAsync();
            return Ok(result);
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser() { 
        var userId = GetCurrentUserId();
            var result = await _userService.GetByIdAsync(userId);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequestDto request)
        {
            var currentUserId = GetCurrentUserId();
            var currentUserRole = GetCurrentUserRole();

            // Only allow users to update their own profile, unless they're Admin
            if (id != currentUserId && currentUserRole != "Admin")
            {
                return Forbid();
            }

            var result = await _userService.UpdateAsync(id, request);

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
    }
}
