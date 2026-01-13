using System.ComponentModel.DataAnnotations;

namespace AMS.Application.DTOs.Group
{
    public class CreateGroupRequestDto
    {
        [Required]
        public int AssignmentId { get; set; }
        
        [Required]
        [StringLength(100, MinimumLength = 3)]
        public string GroupName { get; set; } = string.Empty;
        
        [Required]
        [MinLength(1, ErrorMessage = "At least one group member is required")]
        public List<int> MemberIds { get; set; } = new();
    }

    public class GroupResponseDto
    {
        public int Id { get; set; }
        public string GroupName { get; set; } = string.Empty;
        public int AssignmentId { get; set; }
        public string AssignmentTitle { get; set; } = string.Empty;
        public int LeaderStudentId { get; set; }
        public string LeaderName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public bool HasSubmission { get; set; }
        public List<GroupMemberDto> Members { get; set; } = new();
    }

    public class GroupMemberDto
    {
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string StudentNumber { get; set; } = string.Empty;
        public bool IsLeader { get; set; }
    }

    public class AvailableStudentDto
    {
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string StudentNumber { get; set; } = string.Empty;
        public bool IsInGroup { get; set; }
    }
}