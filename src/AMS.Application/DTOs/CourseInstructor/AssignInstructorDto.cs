using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.DTOs.CourseInstructor
{
    public class AssignInstructorDto
    {
        [Required]
        public int InstructorId { get; set; }

        [Required]
        [StringLength(20)]
        public string AcademicYear { get; set; } = string.Empty;  // "2024-2025"
    }
}