using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.DTOs.Submission
{
    public class CreateSubmissionRequestDto
    {
        public int AssignmentId { get; set; }
        public int? GroupId { get; set; }
        public string? Comments { get; set; }
        // File will be handled separately via IFormFile in controller
    }
}

