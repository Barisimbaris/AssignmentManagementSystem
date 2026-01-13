using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.DTOs.Statistics
{
    public class StudentDashboardDto
    {
        public int EnrolledClasses { get; set; }
        public int TotalAssignments { get; set; }
        public int CompletedAssignments { get; set; }
        public int PendingAssignments { get; set; }
        public double AverageGrade { get; set; }
        public List<ClassProgressDto> ClassProgress { get; set; } = new();
        public List<UpcomingAssignmentDto> UpcomingAssignments { get; set; } = new();
        public List<RecentGradeDto> RecentGrades { get; set; } = new();
    }
}