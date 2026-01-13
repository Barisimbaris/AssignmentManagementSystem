using AMS.Domain.Common;
using AMS.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Domain.Entities
{
    public class User : BaseEntity {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public UserRole Role { get; set; }
        public string? StudentNumber { get; set; }
        public string? Department { get; set; }
        public string? PhoneNumber { get; set; }

        // Navigation Properties
        public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
        public ICollection<Class> TaughtClasses { get; set; } = new List<Class>();
        public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    }
}
