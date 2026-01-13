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
        /// Get all classes (Admin only)
        /// </summary>
        [Authorize(Roles = "Admin")]
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
        [Authorize(Roles = "Instructor")]
        [HttpGet("my-classes")]
        public async Task<IActionResult> GetMyClasses()
        {
            var instructorId = GetCurrentUserId();
            var result = await _classService.GetByInstructorIdAsync(instructorId);
            return Ok(result);
        }

        /// <summary>
        /// Create new class (Admin only)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateClassRequestDto request)
        {
            // ✅ FIX: request.InstructorId kullan, currentUserId değil
            var result = await _classService.CreateAsync(request, request.InstructorId);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
        }

        /// <summary>
        /// Update class (Admin only)
        /// </summary>
        [Authorize(Roles = "Admin")]
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
        /// Enroll student to class (Instructor/Admin)
        /// </summary>
        [Authorize(Roles = "Instructor,Admin")]
        [HttpPost("{classId}/enroll/{studentId}")]
        public async Task<IActionResult> EnrollStudent(int classId, int studentId)
        {
            var result = await _classService.EnrollStudentAsync(classId, studentId);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Unenroll student from class (Instructor/Admin)
        /// </summary>
        [Authorize(Roles = "Instructor,Admin")]
        [HttpPost("{classId}/unenroll/{studentId}")]
        public async Task<IActionResult> UnenrollStudent(int classId, int studentId)
        {
            var result = await _classService.UnenrollStudentAsync(classId, studentId);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Enroll myself to class (Student only)
        /// </summary>
        [Authorize(Roles = "Student")]
        [HttpPost("{classId}/enroll-me")]
        public async Task<IActionResult> EnrollMyself(int classId)
        {
            var studentId = GetCurrentUserId();
            var result = await _classService.EnrollStudentAsync(classId, studentId);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Unenroll myself from class (Student only)
        /// </summary>
        [Authorize(Roles = "Student")]
        [HttpPost("{classId}/unenroll-me")]
        public async Task<IActionResult> UnenrollMyself(int classId)
        {
            var studentId = GetCurrentUserId();
            var result = await _classService.UnenrollStudentAsync(classId, studentId);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Get students enrolled in class (Instructor/Admin only)
        /// </summary>
        [Authorize(Roles = "Instructor,Admin")]
        [HttpGet("{classId}/students")]
        public async Task<IActionResult> GetClassStudents(int classId)
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            // Instructor sadece kendi class'larının öğrencilerini görebilir
            if (userRole == "Instructor")
            {
                var classEntity = await _classService.GetByIdAsync(classId);
                if (!classEntity.IsSuccess || classEntity.Data == null)
                {
                    return NotFound("Class not found");
                }

                // Class'ın instructor'ı kontrol et
                if (classEntity.Data.InstructorId != userId)
                {
                    return Forbid("You can only view students of your own classes");
                }
            }

            var result = await _classService.GetClassStudentsAsync(classId);
            return Ok(result);
        }
    }
}
