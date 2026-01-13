using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.DTOs.Assignment
{
    public class UpdateAssignmentRequestDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public DateTime? DueDate { get; set; }
        public int? MaxScore { get; set; }
        public bool? AllowLateSubmission { get; set; }
        public bool? AllowResubmission { get; set; }
    }
}
