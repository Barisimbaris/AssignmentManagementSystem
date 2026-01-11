using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.DTOs.Statistics
{
    public class UpcomingAssignmentDto
    {
        public int AssignmentId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string ClassName { get; set; } = string.Empty;
        public string CourseCode { get; set; } = string.Empty;
        public DateTime DueDate { get; set; }
        public int MaxScore { get; set; }
        public bool IsSubmitted { get; set; }
        public int DaysUntilDue { get; set; }
    }
}