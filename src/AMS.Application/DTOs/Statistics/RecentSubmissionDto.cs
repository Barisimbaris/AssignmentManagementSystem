using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.DTOs.Statistics
{
    public class RecentSubmissionDto
    {
        public int SubmissionId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string StudentEmail { get; set; } = string.Empty;
        public string AssignmentTitle { get; set; } = string.Empty;
        public string ClassName { get; set; } = string.Empty;
        public DateTime SubmittedAt { get; set; }
        public bool IsGraded { get; set; }
        public string TimeAgo { get; set; } = string.Empty;
    }
}