using AMS.Domain.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Domain.Entities
{
    public class AssignmentGroup : BaseEntity
    {
        public int AssignmentId { get; set; }
        public string GroupName { get; set; } = string.Empty;

        // Navigation Properties
        public Assignment Assignment { get; set; } = null!;
        public ICollection<GroupMember> Members { get; set; } = new List<GroupMember>();
    }
}
