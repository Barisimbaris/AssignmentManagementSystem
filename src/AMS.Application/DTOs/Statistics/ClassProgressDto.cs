using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.DTOs.Statistics
{
    public class ClassProgressDto
    {
        public int ClassId { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public string CourseCode { get; set; } = string.Empty;
        public int TotalAssignments { get; set; }
        public int CompletedAssignments { get; set; }
        public double CompletionPercentage { get; set; }
        public double AverageGrade { get; set; }
    }
}