using AMS.Domain.Common;
using AMS.Domain.Common;
using System.Security.Claims;

namespace AMS.Domain.Entities;

public class Enrollment : BaseEntity
{
    public int StudentId { get; set; }
    public int ClassId { get; set; }
    public DateTime EnrollmentDate { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    // Navigation Properties
    public User Student { get; set; } = null!;
    public Class Class { get; set; } = null!;
}