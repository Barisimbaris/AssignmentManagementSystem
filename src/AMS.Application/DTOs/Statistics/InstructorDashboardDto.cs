using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.DTOs.Statistics
{
    public class InstructorDashboardDto
    {
        public int TotalClasses { get; set; }
        public int TotalStudents { get; set; }
        public int TotalAssignments { get; set; }
        public int PendingGrades { get; set; }
        public List<ClassStatisticsDto> ClassStatistics { get; set; } = new();
        public List<RecentSubmissionDto> RecentSubmissions { get; set; } = new();
        public List<UpcomingDeadlineDto> UpcomingDeadlines { get; set; } = new();
    }
}