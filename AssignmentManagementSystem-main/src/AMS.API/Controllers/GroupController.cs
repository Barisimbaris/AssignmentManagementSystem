using AMS.Application.DTOs.Group;
using AMS.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class GroupController : BaseController
    {
        private readonly IGroupService _groupService;
        private readonly ISubmissionService _submissionService;

        public GroupController(IGroupService groupService, ISubmissionService submissionService)
        {
            _groupService = groupService;
            _submissionService = submissionService;
        }

        /// <summary>
        /// Create group for assignment (Student - Leader only)
        /// </summary>
        [Authorize(Roles = "Student")]
        [HttpPost("create")]
        public async Task<IActionResult> CreateGroup([FromBody] CreateGroupRequestDto request)
        {
            Console.WriteLine($"?? Group creation request received:");
            Console.WriteLine($"?? AssignmentId: {request.AssignmentId}");
            Console.WriteLine($"?? Group Name: {request.GroupName}");
            Console.WriteLine($"?? Member count: {request.MemberIds?.Count ?? 0}");

            var leaderStudentId = GetCurrentUserId();
            Console.WriteLine($"?? Leader Student ID: {leaderStudentId}");

            var result = await _groupService.CreateGroupAsync(request, leaderStudentId);

            if (!result.IsSuccess)
            {
                Console.WriteLine($"? Group creation failed: {result.Message}");
                return BadRequest(result);
            }

            Console.WriteLine($"? Group created successfully: {result.Data!.GroupName}");
            return CreatedAtAction(nameof(GetGroupDetails), new { id = result.Data!.Id }, result);
        }

        /// <summary>
        /// Get my group for assignment (Student)
        /// </summary>
        [Authorize(Roles = "Student")]
        [HttpGet("my-group/{assignmentId}")]
        public async Task<IActionResult> GetMyGroup(int assignmentId)
        {
            var studentId = GetCurrentUserId();
            var result = await _groupService.GetMyGroupAsync(assignmentId, studentId);
            return Ok(result);
        }

        /// <summary>
        /// Get available students for group formation (Student)
        /// </summary>
        [Authorize(Roles = "Student")]
        [HttpGet("available-students/{assignmentId}")]
        public async Task<IActionResult> GetAvailableStudents(int assignmentId)
        {
            var currentStudentId = GetCurrentUserId();
            var result = await _groupService.GetAvailableStudentsAsync(assignmentId, currentStudentId);
            
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Check if student can create group for assignment (Student)
        /// </summary>
        [Authorize(Roles = "Student")]
        [HttpGet("can-create/{assignmentId}")]
        public async Task<IActionResult> CanCreateGroup(int assignmentId)
        {
            var studentId = GetCurrentUserId();
            var result = await _groupService.CanCreateGroupAsync(assignmentId, studentId);
            return Ok(result);
        }

        /// <summary>
        /// Get all groups for assignment (Instructor)
        /// </summary>
        [Authorize(Roles = "Instructor,Admin")]
        [HttpGet("assignment/{assignmentId}")]
        public async Task<IActionResult> GetAssignmentGroups(int assignmentId)
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            Console.WriteLine($"?? Getting groups for assignment {assignmentId} by {userRole} user {userId}");

            if (userRole == "Admin")
            {
                var result = await _groupService.GetAssignmentGroupsAsync(assignmentId);
                return Ok(result);
            }
            else
            {
                // Instructor - permission check
                var result = await _groupService.GetInstructorGroupsAsync(assignmentId, userId);
                
                if (!result.IsSuccess)
                {
                    return Forbid();
                }
                
                return Ok(result);
            }
        }

        /// <summary>
        /// Get group details with members (All authorized users)
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetGroupDetails(int id)
        {
            Console.WriteLine($"?? Getting group details for group {id}");

            var result = await _groupService.GetGroupDetailsAsync(id);
            
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Check if current user is group leader (Student)
        /// </summary>
        [Authorize(Roles = "Student")]
        [HttpGet("{groupId}/is-leader")]
        public async Task<IActionResult> IsGroupLeader(int groupId)
        {
            var studentId = GetCurrentUserId();
            var result = await _groupService.IsStudentGroupLeaderAsync(groupId, studentId);
            return Ok(result);
        }

        /// <summary>
        /// Get group submission details (Group members + Instructor)
        /// </summary>
        [HttpGet("{groupId}/submission")]
        public async Task<IActionResult> GetGroupSubmission(int groupId)
        {
            // Grup detaylar?n? al
            var groupResult = await _groupService.GetGroupDetailsAsync(groupId);
            if (!groupResult.IsSuccess)
            {
                return BadRequest(groupResult);
            }

            var group = groupResult.Data!;
            var currentUserId = GetCurrentUserId();
            var currentUserRole = GetCurrentUserRole();

            // Permission check: Grup �yesi mi veya instructor m??
            if (currentUserRole == "Student")
            {
                var isMember = group.Members.Any(m => m.StudentId == currentUserId);
                if (!isMember)
                {
                    return Forbid();
                }
            }
            
            // Grup submission'?n? al
            var submissionResult = await _submissionService.GetByAssignmentIdAsync(group.AssignmentId);
            if (!submissionResult.IsSuccess)
            {
                return Ok(new { hasSubmission = false, group = group });
            }

            // GroupId kontrol� i�in submission'lar? filtrele (ge�ici ��z�m)
            var groupSubmission = submissionResult.Data!
                .Where(s => s.Comments != null && s.Comments.Contains($"GroupId:{groupId}"))
                .FirstOrDefault();
            
            return Ok(new { 
                hasSubmission = groupSubmission != null, 
                submission = groupSubmission,
                group = group 
            });
        }

        /// <summary>
        /// Add member to group (Student - Leader only)
        /// </summary>
        [Authorize(Roles = "Student")]
        [HttpPost("{groupId}/add-member")]
        public async Task<IActionResult> AddGroupMember(int groupId, [FromBody] AddGroupMemberRequestDto request)
        {
            var leaderStudentId = GetCurrentUserId();
            var result = await _groupService.AddGroupMemberAsync(groupId, request.StudentId, leaderStudentId);
            
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }
            
            return Ok(result);
        }

        /// <summary>
        /// Remove member from group (Student - Leader only)
        /// </summary>
        [Authorize(Roles = "Student")]
        [HttpPost("{groupId}/remove-member")]
        public async Task<IActionResult> RemoveGroupMember(int groupId, [FromBody] RemoveGroupMemberRequestDto request)
        {
            var leaderStudentId = GetCurrentUserId();
            var result = await _groupService.RemoveGroupMemberAsync(groupId, request.StudentId, leaderStudentId);
            
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }
            
            return Ok(result);
        }
    }
}