using AMS.Domain.Common;
using AMS.Domain.Common;
using AMS.Domain.Enums;
using System.Diagnostics;

namespace AMS.Domain.Entities;

public class Submission : BaseEntity
{
    public int AssignmentId { get; set; }
    public int StudentId { get; set; }
    public int? GroupId { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public FileType FileType { get; set; }
    public long FileSizeInBytes { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public SubmissionStatus Status { get; set; }
    public bool IsLate { get; set; }
    public string? Comments { get; set; }

    // Navigation Properties
    public Assignment Assignment { get; set; } = null!;
    public User Student { get; set; } = null!;
    public AssignmentGroup? Group { get; set; }
    public Grade? Grade { get; set; }
}