using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.DTOs.Class
{
    public class ClassResponseDto
    {
        public int Id { get; set; }
        public int CourseId { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public string CourseCode { get; set; } = string.Empty;
        public string ClassName { get; set; } = string.Empty;
        public string? ClassCode { get; set; }
        public int InstructorId { get; set; }
        public string InstructorName { get; set; } = string.Empty;
        public int MaxCapacity { get; set; }
        public int CurrentEnrollment { get; set; }
        public string Semester { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
