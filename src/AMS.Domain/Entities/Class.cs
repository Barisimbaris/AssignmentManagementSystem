using AMS.Domain.Common;
using AMS.Domain.Common;

namespace AMS.Domain.Entities;

public class Class : BaseEntity
{
    public int CourseId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public int InstructorId { get; set; }
    public string? ClassCode { get; set; }
    public int MaxCapacity { get; set; } = 50;
    public string Semester { get; set; } = string.Empty;

    // Navigation Properties
    public Course Course { get; set; } = null!;
    public User Instructor { get; set; } = null!;
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
}