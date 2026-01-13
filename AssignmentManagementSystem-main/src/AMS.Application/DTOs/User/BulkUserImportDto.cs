using AMS.Domain.Enums;

namespace AMS.Application.DTOs.User
{
    public class BulkUserImportDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public UserRole Role { get; set; }
        public string? StudentNumber { get; set; }
        public string? Department { get; set; }
        public string? PhoneNumber { get; set; }
    }

    public class BulkImportRequestDto
    {
        public List<BulkUserImportDto> Users { get; set; } = new();
        public bool SkipDuplicateEmails { get; set; } = true;
        public bool SendWelcomeEmails { get; set; } = false;
    }

    public class BulkImportResultDto
    {
        public int TotalUsers { get; set; }
        public int SuccessfulImports { get; set; }
        public int FailedImports { get; set; }
        public List<BulkImportErrorDto> Errors { get; set; } = new();
        public List<int> CreatedUserIds { get; set; } = new();
    }

    public class BulkImportErrorDto
    {
        public int RowNumber { get; set; }
        public string Email { get; set; } = string.Empty;
        public string ErrorMessage { get; set; } = string.Empty;
    }
}