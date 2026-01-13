using System;
using System.ComponentModel.DataAnnotations;

namespace AMS.Application.DTOs.LessonPlan
{
    public class CreateLessonPlanRequestDto
    {
        [Required]
        public int ClassId { get; set; }

        [Required]
        public int WeekNumber { get; set; }

        [Required]
        [MaxLength(200)]
        public string Topic { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }
    }
}


