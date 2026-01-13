using AMS.Application.DTOs.ClassSchedule;
using AMS.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ClassScheduleController : BaseController
    {
        private readonly IClassScheduleService _scheduleService;

        public ClassScheduleController(IClassScheduleService scheduleService)
        {
            _scheduleService = scheduleService;
        }

        /// <summary>
        /// Get schedule by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _scheduleService.GetByIdAsync(id);
            return Ok(result);
        }

        /// <summary>
        /// Get schedules by class ID
        /// </summary>
        [HttpGet("class/{classId}")]
        public async Task<IActionResult> GetByClassId(int classId)
        {
            var result = await _scheduleService.GetByClassIdAsync(classId);
            return Ok(result);
        }

        /// <summary>
        /// Get my schedules (as instructor)
        /// </summary>
        [Authorize(Roles = "Instructor")]
        [HttpGet("my-schedules")]
        public async Task<IActionResult> GetMySchedules()
        {
            var instructorId = GetCurrentUserId();
            var result = await _scheduleService.GetByInstructorIdAsync(instructorId);
            return Ok(result);
        }

        /// <summary>
        /// Get weekly schedule for class
        /// </summary>
        [HttpGet("class/{classId}/weekly")]
        public async Task<IActionResult> GetWeeklySchedule(int classId)
        {
            var result = await _scheduleService.GetWeeklyScheduleAsync(classId);
            return Ok(result);
        }

        /// <summary>
        /// Create schedule (Instructor only)
        /// </summary>
        [Authorize(Roles = "Instructor,Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateClassScheduleRequestDto request)
        {
            var instructorId = GetCurrentUserId();
            var result = await _scheduleService.CreateAsync(request, instructorId);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
        }

        /// <summary>
        /// Update schedule (Instructor only)
        /// </summary>
        [Authorize(Roles = "Instructor,Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateClassScheduleRequestDto request)
        {
            var instructorId = GetCurrentUserId();
            var result = await _scheduleService.UpdateAsync(id, request, instructorId);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Delete schedule (Instructor only)
        /// </summary>
        [Authorize(Roles = "Instructor,Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var instructorId = GetCurrentUserId();
            var result = await _scheduleService.DeleteAsync(id, instructorId);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
    }
}
