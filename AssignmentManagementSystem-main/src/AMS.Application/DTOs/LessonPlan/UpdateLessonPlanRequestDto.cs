using System;
using System.ComponentModel.DataAnnotations;

namespace AMS.Application.DTOs.LessonPlan
{
    public class UpdateLessonPlanRequestDto
    {
        public int? WeekNumber { get; set; }

        [MaxLength(200)]
        public string? Topic { get; set; }

        [MaxLength(2000)]
        public string? Description { get; set; }

        public DateTime? StartDate { get; set; }

        public DateTime? EndDate { get; set; }
    }
}


