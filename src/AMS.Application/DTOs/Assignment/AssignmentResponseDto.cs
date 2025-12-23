using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.DTOs.Assignment
{
    public class AssignmentResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int ClassId { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public string AssignmentType { get; set; } = string.Empty;
        public DateTime DueDate { get; set; }
        public int MaxScore { get; set; }
        public bool AllowLateSubmission { get; set; }
        public bool AllowResubmission { get; set; }
        public string? AttachmentPath { get; set; }
        public int TotalSubmissions { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Type { get; set; } = string.Empty;
        public int InstructorId { get; set; }
    }
}
