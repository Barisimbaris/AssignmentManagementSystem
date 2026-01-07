using AMS.Domain.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Domain.Entities
{
    public class CourseInstructor: BaseEntity
    {
        public int CourseId { get; set; }
        public int InstructorId { get; set; }
        public string AcademicYear { get; set; } = string.Empty;  // "2024-2025"
        public bool IsActive { get; set; } = true;

        // Navigation Properties
        public Course Course { get; set; } = null!;
        public User Instructor { get; set; } = null!;
    }
}
