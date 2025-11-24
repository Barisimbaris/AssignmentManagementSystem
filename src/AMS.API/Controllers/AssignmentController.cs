using AMS.Application.DTOs.Assignment;
using AMS.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AssignmentController : BaseController
    {
        private readonly IAssignmentService _assignmentService;

        public AssignmentController(IAssignmentService assignmentService)
        {
            _assignmentService = assignmentService;
        }

        /// <summary>
        /// Get assignment by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _assignmentService.GetByIdAsync(id);
            return Ok(result);
        }

        /// <summary>
        /// Get all assignments
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _assignmentService.GetAllAsync();
            return Ok(result);
        }

        /// <summary>
        /// Get assignments by class ID
        /// </summary>
        [HttpGet("class/{classId}")]
        public async Task<IActionResult> GetByClassId(int classId)
        {
            var result = await _assignmentService.GetByClassIdAsync(classId);
            return Ok(result);
        }

        /// <summary>
        /// Get my assignments (as student)
        /// </summary>
        [Authorize(Roles = "Student")]
        [HttpGet("my-assignments")]
        public async Task<IActionResult> GetMyAssignments()
        {
            var studentId = GetCurrentUserId();
            var result = await _assignmentService.GetByStudentIdAsync(studentId);
            return Ok(result);
        }

        /// <summary>
        /// Create new assignment (Instructor only)
        /// </summary>
        [Authorize(Roles = "Instructor,Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateAssignmentRequestDto request)
        {
            var instructorId = GetCurrentUserId();
            var result = await _assignmentService.CreateAsync(request, instructorId);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
        }

        /// <summary>
        /// Update assignment (Instructor only)
        /// </summary>
        [Authorize(Roles = "Instructor,Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateAssignmentRequestDto request)
        {
            var instructorId = GetCurrentUserId();
            var result = await _assignmentService.UpdateAsync(id, request, instructorId);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Delete assignment (Instructor only)
        /// </summary>
        [Authorize(Roles = "Instructor,Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var instructorId = GetCurrentUserId();
            var result = await _assignmentService.DeleteAsync(id, instructorId);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
    }
}
