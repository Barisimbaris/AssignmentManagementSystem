using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.DTOs.Statistics
{
    public class ClassStatisticsDto
    {
        public int ClassId { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public string CourseCode { get; set; } = string.Empty;
        public int TotalStudents { get; set; }
        public int TotalAssignments { get; set; }
        public int TotalSubmissions { get; set; }
        public int PendingSubmissions { get; set; }
        public double AverageGrade { get; set; }
    }
}