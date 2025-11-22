using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.DTOs.Course
{
    public class CourseResponseDto
    {
        public int Id { get; set; }
        public string CourseCode { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Department { get; set; } = string.Empty;
        public int CreditHours { get; set; }
        public string AcademicYear { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
