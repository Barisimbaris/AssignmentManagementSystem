using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.DTOs.Course
{
    public class UpdateCourseRequestDto
    {
        public string? CourseName { get; set; }
        public string? Description { get; set; }
        public int? CreditHours { get; set; }
    }
}
