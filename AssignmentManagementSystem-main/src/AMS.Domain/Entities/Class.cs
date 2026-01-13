using AMS.Domain.Common;
using System.ComponentModel.DataAnnotations;


namespace AMS.Domain.Entities;

public class Class : BaseEntity
{
    [Required]
    [MaxLength(200)]
    public string ClassName { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? ClassCode { get; set; }

    [Required]
    public int CourseId { get; set; }

    [Required]
    public int InstructorId { get; set; }

    [Required]
    public int MaxCapacity { get; set; } = 30;

    public int CurrentEnrollment { get; set; } = 0;

    [Required]
    [MaxLength(50)]
    public string Semester { get; set; } = string.Empty;

    // Navigation properties
    public Course Course { get; set; } = null!;
    public User Instructor { get; set; } = null!;
    public List<Enrollment> Enrollments { get; set; } = new();
    public List<Assignment> Assignments { get; set; } = new();
    
    // ✅ Schedule Navigation Property Eklendi
    public List<ClassSchedule> Schedules { get; set; } = new();
    
    // ✅ LessonPlan Navigation Property Eklendi
    public List<LessonPlan> LessonPlans { get; set; } = new();
}