using AMS.Application.DTOs.Course;
using AMS.Application.DTOs.CourseInstructor;
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

        /// <summary>
        /// Assign instructor to course (Admin only)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPost("{courseId}/assign-instructor")]
        public async Task<IActionResult> AssignInstructor(
            int courseId,
            [FromBody] AssignInstructorDto request)
        {
            var result = await _courseService.AssignInstructorAsync(
                courseId,
                request.InstructorId,
                request.AcademicYear);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        /// <summary>
        /// Remove instructor from course (Admin only)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpDelete("{courseId}/instructor/{instructorId}")]
        public async Task<IActionResult> RemoveInstructor(int courseId, int instructorId)
        {
            var result = await _courseService.RemoveInstructorAsync(courseId, instructorId);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        /// <summary>
        /// Get all instructors assigned to a course (Admin only)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("{courseId}/instructors")]
        public async Task<IActionResult> GetCourseInstructors(int courseId)
        {
            var result = await _courseService.GetCourseInstructorsAsync(courseId);
            return Ok(result);
        }

        /// <summary>
        /// Get my assigned courses (Instructor only)
        /// </summary>
        [Authorize(Roles = "Instructor")]
        [HttpGet("my-courses")]
        public async Task<IActionResult> GetMyCourses()
        {
            var instructorId = GetCurrentUserId();
            var result = await _courseService.GetInstructorCoursesAsync(instructorId);
            return Ok(result);
        }
    }
}
