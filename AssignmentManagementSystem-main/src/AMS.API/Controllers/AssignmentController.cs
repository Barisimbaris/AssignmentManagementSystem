using AMS.Application.DTOs.Assignment;
using AMS.Application.Services.Interfaces;
using AMS.Domain.Interfaces;
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
        private readonly IAssignmentRepository _assignmentRepository;
        private readonly IFileService _fileService;

        public AssignmentController(
            IAssignmentService assignmentService,
            IAssignmentRepository assignmentRepository,
            IFileService fileService)
        {
            _assignmentService = assignmentService;
            _assignmentRepository = assignmentRepository;
            _fileService = fileService;
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
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();
            if (userRole == "Admin")
            {
                var allResult = await _assignmentService.GetAllAsync();
                return Ok(allResult);
            }

            // Instructor sadece kendi ödevlerini görebilir
            if (userRole == "Instructor")
            {
                var instructorResult = await _assignmentService.GetByInstructorIdAsync(userId);
                return Ok(instructorResult);
            }

            // Student sadece kayıtlı olduğu sınıfların ödevlerini görebilir
            var studentResult = await _assignmentService.GetByStudentIdAsync(userId);
            return Ok(studentResult);
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
            var userId = GetCurrentUserId();
            var result = await _assignmentService.CreateAsync(request, userId);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
        }

        /// <summary>
        /// Upload or replace assignment attachment (Instructor/Admin only)
        /// </summary>
        [Authorize(Roles = "Instructor,Admin")]
        [HttpPost("{id}/attachment")]
        public async Task<IActionResult> UploadAttachment(int id, IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "Dosya yüklenmedi" });
            }

            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var assignment = await _assignmentRepository.GetByIdAsync(id);
            if (assignment == null)
            {
                return NotFound(new { message = "Assignment not found" });
            }

            // Instructor sadece kendi sınıfının ödevine dosya ekleyebilir
            if (userRole == "Instructor" && assignment.Class.InstructorId != userId)
            {
                return Forbid("Only the class instructor can upload attachments for this assignment");
            }

            // Eski dosya varsa sil
            if (!string.IsNullOrWhiteSpace(assignment.AttachmentPath))
            {
                await _fileService.DeleteFileAsync(assignment.AttachmentPath);
            }

            // Yeni dosyayı yükle
            var folderPath = $"assignments/assignment_{assignment.Id}";
            var storedPath = await _fileService.UploadFileAsync(file, folderPath);

            assignment.AttachmentPath = storedPath;
            await _assignmentRepository.UpdateAsync(assignment);
            await _assignmentRepository.SaveChangesAsync();

            return Ok(new { message = "Attachment uploaded successfully", attachmentPath = storedPath });
        }

        /// <summary>
        /// Download assignment attachment
        /// </summary>
        [HttpGet("{id}/download")]
        public async Task<IActionResult> DownloadAttachment(int id)
        {
            var assignment = await _assignmentRepository.GetByIdAsync(id);
            if (assignment == null || string.IsNullOrWhiteSpace(assignment.AttachmentPath))
            {
                return NotFound(new { message = "Attachment not found" });
            }

            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "Uploads", assignment.AttachmentPath);
            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new { message = "Attachment file not found on server" });
            }

            var storedFileName = Path.GetFileName(filePath);
            var fileExtension = Path.GetExtension(storedFileName).ToLowerInvariant();

            // Kaydedilen dosya adı formatı: {Guid}_{OrijinalAd}
            var originalFileName = storedFileName;
            var underscoreIndex = storedFileName.IndexOf('_');
            if (underscoreIndex > 0 && underscoreIndex < storedFileName.Length - 1)
            {
                originalFileName = storedFileName[(underscoreIndex + 1)..];
            }

            var contentType = fileExtension switch
            {
                ".pdf" => "application/pdf",
                ".png" => "image/png",
                ".jpg" => "image/jpeg",
                ".jpeg" => "image/jpeg",
                ".gif" => "image/gif",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".xls" => "application/vnd.ms-excel",
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".zip" => "application/zip",
                ".rar" => "application/x-rar-compressed",
                _ => "application/octet-stream"
            };

            // Fiziksel dosyayı stream olarak döndür (belleğe komple almadan)
            // File() metodu zaten Content-Disposition header'ını otomatik ekliyor
            var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
            return File(stream, contentType, originalFileName);
        }

        /// <summary>
        /// Update assignment (Instructor only)
        /// </summary>
        [Authorize(Roles = "Instructor,Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateAssignmentRequestDto request)
        {
            var userId = GetCurrentUserId();
            var result = await _assignmentService.UpdateAsync(id, request, userId);

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
            var userId = GetCurrentUserId();
            var result = await _assignmentService.DeleteAsync(id, userId);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
    }
}
