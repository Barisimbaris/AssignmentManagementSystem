using AMS.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.DTOs.Assignment
{
    public class CreateAssignmentRequestDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int ClassId { get; set; }
        public AssignmentType Type { get; set; }
        public DateTime DueDate { get; set; }
        public int MaxScore { get; set; } = 100;
        public bool AllowLateSubmission { get; set; } = false;
        public bool AllowResubmission { get; set; } = false;
    }
}
