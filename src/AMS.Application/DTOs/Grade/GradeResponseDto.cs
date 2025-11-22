using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.DTOs.Grade
{
    public class GradeResponseDto
    {
        public int Id { get; set; }
        public int SubmissionId { get; set; }
        public int AssignmentId { get; set; }
        public string AssignmentTitle { get; set; } = string.Empty;
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public decimal Score { get; set; }
        public int MaxScore { get; set; }
        public string? Feedback { get; set; }
        public DateTime GradedAt { get; set; }
        public string InstructorName { get; set; } = string.Empty;
        public bool IsPublished { get; set; }
    }
}
