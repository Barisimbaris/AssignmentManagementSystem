using AMS.Application.DTOs.Grade;
using AMS.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GradeController : BaseController
    {
        private readonly IGradeService _gradeService;

        public GradeController(IGradeService gradeService)
        {
            _gradeService = gradeService;
        }

        /// <summary>
        /// Get grade by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _gradeService.GetByIdAsync(id);
            return Ok(result);
        }

        /// <summary>
        /// Get grade by submission ID
        /// </summary>
        [HttpGet("submission/{submissionId}")]
        public async Task<IActionResult> GetBySubmissionId(int submissionId)
        {
            var result = await _gradeService.GetBySubmissionIdAsync(submissionId);
            return Ok(result);
        }

        /// <summary>
        /// Get my grades (as student)
        /// </summary>
        [Authorize(Roles = "Student")]
        [HttpGet("my-grades")]
        public async Task<IActionResult> GetMyGrades()
        {
            var studentId = GetCurrentUserId();
            var result = await _gradeService.GetByStudentIdAsync(studentId);
            return Ok(result);
        }

        /// <summary>
        /// Get grades by class ID (Instructor only)
        /// </summary>
        [Authorize(Roles = "Instructor,Admin")]
        [HttpGet("class/{classId}")]
        public async Task<IActionResult> GetByClassId(int classId)
        {
            var result = await _gradeService.GetByClassIdAsync(classId);
            return Ok(result);
        }

        /// <summary>
        /// Create grade (Instructor only)
        /// </summary>
        [Authorize(Roles = "Instructor,Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateGradeRequestDto request)
        {
            var instructorId = GetCurrentUserId();
            var result = await _gradeService.CreateAsync(request, instructorId);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
        }

        /// <summary>
        /// Update grade (Instructor only)
        /// </summary>
        [Authorize(Roles = "Instructor,Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateGradeRequestDto request)
        {
            var instructorId = GetCurrentUserId();
            var result = await _gradeService.UpdateAsync(id, request, instructorId);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Publish grades (Instructor only)
        /// </summary>
        [Authorize(Roles = "Instructor,Admin")]
        [HttpPost("publish")]
        public async Task<IActionResult> PublishGrades([FromBody] PublishGradesRequestDto request)
        {
            var instructorId = GetCurrentUserId();
            var result = await _gradeService.PublishGradesAsync(request.GradeIds, instructorId);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Delete grade (Instructor only)
        /// </summary>
        [Authorize(Roles = "Instructor,Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var instructorId = GetCurrentUserId();
            var result = await _gradeService.DeleteAsync(id, instructorId);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
    }
}
