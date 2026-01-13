using AMS.Application.DTOs.LessonPlan;
using AMS.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class LessonPlanController : BaseController
    {
        private readonly ILessonPlanService _lessonPlanService;

        public LessonPlanController(ILessonPlanService lessonPlanService)
        {
            _lessonPlanService = lessonPlanService;
        }

        /// <summary>
        /// Get all lesson plans (Instructor only)
        /// </summary>
        [Authorize(Roles = "Instructor,Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var instructorId = GetCurrentUserId();
            var result = await _lessonPlanService.GetByInstructorIdAsync(instructorId);
            return Ok(result);
        }

        /// <summary>
        /// Get lesson plan by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _lessonPlanService.GetByIdAsync(id);
            return Ok(result);
        }

        /// <summary>
        /// Get lesson plans by class ID
        /// </summary>
        [HttpGet("class/{classId}")]
        public async Task<IActionResult> GetByClassId(int classId)
        {
            var result = await _lessonPlanService.GetByClassIdAsync(classId);
            return Ok(result);
        }

        /// <summary>
        /// Create lesson plan (Instructor only)
        /// </summary>
        [Authorize(Roles = "Instructor,Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateLessonPlanRequestDto request)
        {
            var instructorId = GetCurrentUserId();
            var result = await _lessonPlanService.CreateAsync(request, instructorId);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
        }

        /// <summary>
        /// Update lesson plan (Instructor only)
        /// </summary>
        [Authorize(Roles = "Instructor,Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateLessonPlanRequestDto request)
        {
            var instructorId = GetCurrentUserId();
            var result = await _lessonPlanService.UpdateAsync(id, request, instructorId);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Delete lesson plan (Instructor only)
        /// </summary>
        [Authorize(Roles = "Instructor,Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var instructorId = GetCurrentUserId();
            var result = await _lessonPlanService.DeleteAsync(id, instructorId);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
    }
}


