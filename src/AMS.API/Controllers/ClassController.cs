using AMS.Application.DTOs.Class;
using AMS.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClassController : BaseController
    {

        private readonly IClassService _classService;

        public ClassController(IClassService classService)
        {
            _classService = classService;
        }

        /// <summary>
        /// Get class by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _classService.GetByIdAsync(id);
            return Ok(result);
        }

        /// <summary>
        /// Get all classes
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _classService.GetAllAsync();
            return Ok(result);
        }

        /// <summary>
        /// Get classes by course ID
        /// </summary>
        [HttpGet("course/{courseId}")]
        public async Task<IActionResult> GetByCourseId(int courseId)
        {
            var result = await _classService.GetByCourseIdAsync(courseId);
            return Ok(result);
        }

        /// <summary>
        /// Get classes by instructor ID
        /// </summary>
        [HttpGet("instructor/{instructorId}")]
        public async Task<IActionResult> GetByInstructorId(int instructorId)
        {
            var result = await _classService.GetByInstructorIdAsync(instructorId);
            return Ok(result);
        }

        /// <summary>
        /// Get my classes (as instructor)
        /// </summary>
        [Authorize(Roles = "Instructor,Admin")]
        [HttpGet("my-classes")]
        public async Task<IActionResult> GetMyClasses()
        {
            var instructorId = GetCurrentUserId();
            var result = await _classService.GetByInstructorIdAsync(instructorId);
            return Ok(result);
        }

        /// <summary>
        /// Create new class (Instructor or Admin)
        /// </summary>
        [Authorize(Roles = "Instructor,Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateClassRequestDto request)
        {
            var result = await _classService.CreateAsync(request);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
        }

        /// <summary>
        /// Update class (Instructor or Admin)
        /// </summary>
        [Authorize(Roles = "Instructor,Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateClassRequestDto request)
        {
            var result = await _classService.UpdateAsync(id, request);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Delete class (Admin only)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _classService.DeleteAsync(id);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Enroll student to class
        /// </summary>
        [Authorize(Roles = "Student,Admin")]
        [HttpPost("{classId}/enroll")]
        public async Task<IActionResult> EnrollStudent(int classId, [FromBody] int? studentId = null)
        {
            // If studentId not provided, use current user
            var enrollStudentId = studentId ?? GetCurrentUserId();

            var result = await _classService.EnrollStudentAsync(classId, enrollStudentId);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Unenroll student from class
        /// </summary>
        [Authorize(Roles = "Student,Admin")]
        [HttpPost("{classId}/unenroll")]
        public async Task<IActionResult> UnenrollStudent(int classId, [FromBody] int? studentId = null)
        {
            // If studentId not provided, use current user
            var unenrollStudentId = studentId ?? GetCurrentUserId();

            var result = await _classService.UnenrollStudentAsync(classId, unenrollStudentId);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
    }
}
