using AMS.Application.DTOs.Course;
using AMS.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CourseController : BaseController
    {
        private readonly ICourseService _courseService;

        public CourseController(ICourseService courseService)
        {
            _courseService = courseService;
        }

        /// <summary>
        /// Get course by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _courseService.GetByIdAsync(id);
            return Ok(result);
        }

        /// <summary>
        /// Get all courses
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _courseService.GetAllAsync();
            return Ok(result);
        }

        /// <summary>
        /// Get courses by department
        /// </summary>
        [HttpGet("department/{department}")]
        public async Task<IActionResult> GetByDepartment(string department)
        {
            var result = await _courseService.GetByDepartmentAsync(department);
            return Ok(result);
        }

        /// <summary>
        /// Create new course (Admin only)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateCourseRequestDto request)
        {
            var result = await _courseService.CreateAsync(request);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
        }

        /// <summary>
        /// Update course (Admin only)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateCourseRequestDto request)
        {
            var result = await _courseService.UpdateAsync(id, request);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Delete course (Admin only)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _courseService.DeleteAsync(id);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
    }
}
