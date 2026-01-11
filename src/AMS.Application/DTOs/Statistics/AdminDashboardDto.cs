using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.DTOs.Statistics
{
    public class AdminDashboardDto
    {
        public int TotalCourses { get; set; }
        public int TotalClasses { get; set; }
        public int TotalInstructors { get; set; }
        public int TotalStudents { get; set; }
        public int TotalAssignments { get; set; }
        public int TotalSubmissions { get; set; }
        public List<CourseStatisticsDto> CourseStatistics { get; set; } = new();
        public List<DepartmentStatisticsDto> DepartmentStatistics { get; set; } = new();
        public List<RecentActivityDto> RecentActivities { get; set; } = new();
    }
}