using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.DTOs.Statistics
{
    public class RecentGradeDto
    {
        public int GradeId { get; set; }
        public string AssignmentTitle { get; set; } = string.Empty;
        public string ClassName { get; set; } = string.Empty;
        public int Score { get; set; }
        public int MaxScore { get; set; }
        public double Percentage { get; set; }
        public DateTime GradedAt { get; set; }
        public string InstructorName { get; set; } = string.Empty;
        public string TimeAgo { get; set; } = string.Empty;
    }
}