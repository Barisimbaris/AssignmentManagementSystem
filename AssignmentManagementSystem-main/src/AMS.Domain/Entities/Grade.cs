using AMS.Domain.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Domain.Entities
{
    public class Grade : BaseEntity
    {
        public int SubmissionId { get; set; }
        public int InstructorId { get; set; }
        public decimal Score { get; set; }
        public string? Feedback { get; set; }
        public DateTime GradedAt { get; set; } = DateTime.UtcNow;
        public bool IsPublished { get; set; } = false;

        // Navigation Properties
        public Submission Submission { get; set; } = null!;
        public User Instructor { get; set; } = null!;
    }
}
