using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.DTOs.Statistics
{
    public class RecentActivityDto
    {
        public string ActivityType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string UserRole { get; set; } = string.Empty;
        public DateTime ActivityTime { get; set; }
        public string TimeAgo { get; set; } = string.Empty;
        public string RelatedEntity { get; set; } = string.Empty;
        public int? RelatedEntityId { get; set; }
    }
}