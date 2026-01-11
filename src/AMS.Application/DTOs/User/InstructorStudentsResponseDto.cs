using System.Collections.Generic;

namespace AMS.Application.DTOs.User
{
    public class InstructorStudentsResponseDto
    {
        public int ClassId { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public string ClassCode { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;
        public string CourseCode { get; set; } = string.Empty;
        public int StudentCount { get; set; }
        public List<UserResponseDto> Students { get; set; } = new();
    }
}
