using AMS.Application.DTOs.Submission;
using AMS.Application.Services.Implementations;
using AMS.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMS.API.Controllers;

[Authorize]
public class SubmissionController : BaseController
{
    private readonly ISubmissionService _submissionService;
    private readonly IFileService _fileService;
    private readonly IAssignmentService _assignmentService;

    private static readonly string[] AllowedExtensions = { ".pdf", ".jpg", ".jpeg", ".png" };
    private const long MaxFileSizeInBytes = 10 * 1024 * 1024; // 10 MB

    public SubmissionController(
        ISubmissionService submissionService,
        IFileService fileService,
        IAssignmentService assignmentService)
    {
        _submissionService = submissionService;
        _fileService = fileService;
        _assignmentService = assignmentService;
    }

    /// <summary>
    /// Get submission by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _submissionService.GetByIdAsync(id);
        return Ok(result);
    }

    /// <summary>
    /// Get submissions by assignment ID (Instructor only)
    /// </summary>
    [Authorize(Roles = "Instructor,Admin")]
    [HttpGet("assignment/{assignmentId}")]
    public async Task<IActionResult> GetByAssignmentId(int assignmentId)
    {
        Console.WriteLine($"\n🔍 === SUBMISSION DEBUG START ===");
        Console.WriteLine($"📝 AssignmentId: {assignmentId}");

        var userId = GetCurrentUserId();
        Console.WriteLine($"👤 Current UserId: {userId}");

        var userRole = GetCurrentUserRole();
        Console.WriteLine($"🎭 Current UserRole: '{userRole}'");

        // Admin her şeyi görebilir
        if (userRole != "Admin")
        {
            Console.WriteLine($"⚠️  Not Admin, checking ownership...");

            // Instructor kontrolü: Bu assignment instructor'a ait mi?
            var assignment = await _assignmentService.GetByIdAsync(assignmentId);

            Console.WriteLine($"📦 Assignment IsSuccess: {assignment.IsSuccess}");
            Console.WriteLine($"📦 Assignment Data is null: {assignment.Data == null}");

            if (assignment.Data != null)
            {
                Console.WriteLine($"🏫 Assignment.InstructorId: {assignment.Data.InstructorId}");
                Console.WriteLine($"🔍 Comparing: {assignment.Data.InstructorId} == {userId} ?");
                Console.WriteLine($"✔️  Match: {assignment.Data.InstructorId == userId}");
            }

            if (!assignment.IsSuccess || assignment.Data == null)
            {
                Console.WriteLine($"❌ Returning 404 Not Found");
                return NotFound(new { message = "Assignment not found" });
            }

            if (assignment.Data.InstructorId != userId)
            {
                Console.WriteLine($"❌ RETURNING 403 FORBIDDEN!");
                Console.WriteLine($"   Expected InstructorId: {userId}");
                Console.WriteLine($"   Actual InstructorId: {assignment.Data.InstructorId}");
                Console.WriteLine($"🔍 === DEBUG END ===\n");
                return Forbid(); // 403 Forbidden
            }

            Console.WriteLine($"✅ Ownership verified!");
        }
        else
        {
            Console.WriteLine($"✅ Admin bypass - no ownership check");
        }

        Console.WriteLine($"📥 Fetching submissions for assignment {assignmentId}...");
        var result = await _submissionService.GetByAssignmentIdAsync(assignmentId);
        Console.WriteLine($"📊 Submissions count: {result.Data?.Count ?? 0}");
        Console.WriteLine($"🔍 === DEBUG END ===\n");

        return Ok(result);
    }

    /// <summary>
    /// Get my submissions (as student)
    /// </summary>
    [Authorize(Roles = "Student")]
    [HttpGet("my-submissions")]
    public async Task<IActionResult> GetMySubmissions()
    {
        var studentId = GetCurrentUserId();
        var result = await _submissionService.GetByStudentIdAsync(studentId);
        return Ok(result);
    }

    /// <summary>
    /// Submit assignment with file upload (Student only)
    /// </summary>
    [Authorize(Roles = "Student")]
    [HttpPost]
    public async Task<IActionResult> Submit(
        [FromForm] int assignmentId,
        [FromForm] int? groupId,
        [FromForm] string? comments,
        [FromForm] IFormFile file)
    {
        // Validate file
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "File is required" });
        }

        if (!_fileService.IsValidFileType(file.FileName, AllowedExtensions))
        {
            return BadRequest(new { message = $"Invalid file type. Allowed: {string.Join(", ", AllowedExtensions)}" });
        }

        if (_fileService.GetFileSizeInBytes(file) > MaxFileSizeInBytes)
        {
            return BadRequest(new { message = $"File size exceeds maximum limit of {MaxFileSizeInBytes / (1024 * 1024)} MB" });
        }

        var studentId = GetCurrentUserId();

        // Upload file
        var folderPath = $"submissions/assignment_{assignmentId}/student_{studentId}";
        var filePath = await _fileService.UploadFileAsync(file, folderPath);

        // Create submission
        var request = new CreateSubmissionRequestDto
        {
            AssignmentId = assignmentId,
            GroupId = groupId,
            Comments = comments
        };

        var result = await _submissionService.SubmitAsync(request, studentId, filePath);

        if (!result.IsSuccess)
        {
            // Delete uploaded file if submission failed
            await _fileService.DeleteFileAsync(filePath);
            return BadRequest(result);
        }

        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    /// <summary>
    /// Resubmit assignment with new file (Student only)
    /// </summary>
    [Authorize(Roles = "Student")]
    [HttpPut("{id}/resubmit")]
    public async Task<IActionResult> Resubmit(int id, [FromForm] IFormFile file)
    {
        // Validate file
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "File is required" });
        }

        if (!_fileService.IsValidFileType(file.FileName, AllowedExtensions))
        {
            return BadRequest(new { message = $"Invalid file type. Allowed: {string.Join(", ", AllowedExtensions)}" });
        }

        if (_fileService.GetFileSizeInBytes(file) > MaxFileSizeInBytes)
        {
            return BadRequest(new { message = $"File size exceeds maximum limit of {MaxFileSizeInBytes / (1024 * 1024)} MB" });
        }

        var studentId = GetCurrentUserId();

        // Get old submission to delete old file
        var oldSubmission = await _submissionService.GetByIdAsync(id);
        if (oldSubmission.Data != null && !string.IsNullOrEmpty(oldSubmission.Data.FilePath))
        {
            await _fileService.DeleteFileAsync(oldSubmission.Data.FilePath);
        }

        // Upload new file
        var folderPath = $"submissions/resubmit/student_{studentId}";
        var filePath = await _fileService.UploadFileAsync(file, folderPath);

        var result = await _submissionService.ResubmitAsync(id, studentId, filePath);

        if (!result.IsSuccess)
        {
            // Delete uploaded file if resubmission failed
            await _fileService.DeleteFileAsync(filePath);
            return BadRequest(result);
        }

        return Ok(result);
    }
    
    /// <summary>
    /// Download submission file
    /// </summary>
    [HttpGet("{id}/download")]
    public async Task<IActionResult> DownloadFile(int id)
    {
        var submission = await _submissionService.GetByIdAsync(id);

        if (submission.Data == null || string.IsNullOrEmpty(submission.Data.FilePath))
        {
            return NotFound(new { message = "File not found" });
        }

        var filePath = Path.Combine(Directory.GetCurrentDirectory(), "Uploads", submission.Data.FilePath);

        if (!System.IO.File.Exists(filePath))
        {
            return NotFound(new { message = "File not found on server" });
        }

        var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
        var fileName = Path.GetFileName(filePath);
        var contentType = "application/octet-stream";

        return File(fileBytes, contentType, fileName);
    }

    /// <summary>
    /// Delete submission (Student only)
    /// </summary>
    [Authorize(Roles = "Student")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var studentId = GetCurrentUserId();

        // Get submission to delete file
        var submission = await _submissionService.GetByIdAsync(id);
        if (submission.Data != null && !string.IsNullOrEmpty(submission.Data.FilePath))
        {
            await _fileService.DeleteFileAsync(submission.Data.FilePath);
        }

        var result = await _submissionService.DeleteAsync(id, studentId);

        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }
}