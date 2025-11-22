using AMS.Domain.Common;


namespace AMS.Domain.Entities;

public class Notification : BaseEntity
{
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
    public string? RelatedEntityType { get; set; }
    public int? RelatedEntityId { get; set; }

    // Navigation Properties
    public User User { get; set; } = null!;
}