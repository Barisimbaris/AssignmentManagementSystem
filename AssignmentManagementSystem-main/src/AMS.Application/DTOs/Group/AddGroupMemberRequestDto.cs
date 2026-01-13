using System.ComponentModel.DataAnnotations;

namespace AMS.Application.DTOs.Group
{
    public class AddGroupMemberRequestDto
    {
        [Required]
        public int StudentId { get; set; }
    }

    public class RemoveGroupMemberRequestDto
    {
        [Required]
        public int StudentId { get; set; }
    }
}
