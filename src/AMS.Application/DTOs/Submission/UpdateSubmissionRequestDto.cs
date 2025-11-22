using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.DTOs.Submission
{
    public class UpdateSubmissionRequestDto
    {
        public string? Comments { get; set; }
        // Resubmission - new file via IFormFile
    }
}
