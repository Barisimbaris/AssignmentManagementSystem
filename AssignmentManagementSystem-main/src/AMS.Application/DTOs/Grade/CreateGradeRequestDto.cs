using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.DTOs.Grade
{
    public class CreateGradeRequestDto
    {
        public int SubmissionId { get; set; }
        public decimal Score { get; set; }
        public string? Feedback { get; set; }
        public bool IsPublished { get; set; } = false;
    }
}
