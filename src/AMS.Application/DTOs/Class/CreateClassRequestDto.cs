using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.DTOs.Class
{
    public class CreateClassRequestDto
    {
        public int CourseId { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public string? ClassCode { get; set; }
        public int InstructorId { get; set; }
        public int MaxCapacity { get; set; } = 50;
        public string Semester { get; set; } = string.Empty;
    }
}
