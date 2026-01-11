using System;
using System.ComponentModel.DataAnnotations;

namespace AMS.Application.DTOs.ClassSchedule
{
    public class UpdateClassScheduleRequestDto
    {
        [Required]
        public DayOfWeek DayOfWeek { get; set; }

        [Required]
        public TimeSpan StartTime { get; set; }

        [Required]
        public TimeSpan EndTime { get; set; }

        [MaxLength(100)]
        public string? RoomNumber { get; set; }

        [MaxLength(200)]
        public string? Building { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }

        public bool IsActive { get; set; } = true;
    }
}
