using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.DTOs.Statistics
{
    public class UpcomingDeadlineDto
    {
        public int AssignmentId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string ClassName { get; set; } = string.Empty;
        public DateTime DueDate { get; set; }
        public int TotalStudents { get; set; }
        public int SubmissionCount { get; set; }
        public int PendingCount { get; set; }
        public double SubmissionRate { get; set; }
        public int DaysUntilDue { get; set; }
    }
}