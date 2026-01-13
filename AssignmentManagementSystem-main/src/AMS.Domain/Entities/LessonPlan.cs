using AMS.Domain.Common;
using System.ComponentModel.DataAnnotations;

namespace AMS.Domain.Entities
{
    public class LessonPlan : BaseEntity
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

        // Navigation Properties
        public Class Class { get; set; } = null!;
    }
}


