using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.DTOs.Statistics
{
    public class DepartmentStatisticsDto
    {
        public string Department { get; set; } = string.Empty;
        public int TotalCourses { get; set; }
        public int TotalClasses { get; set; }
        public int TotalStudents { get; set; }
        public int TotalInstructors { get; set; }
        public double AverageGrade { get; set; }
    }
}