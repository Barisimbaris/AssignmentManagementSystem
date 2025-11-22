using AMS.Domain.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Domain.Entities
{
    public class GroupMember : BaseEntity
    {
        public int GroupId { get; set; }
        public int StudentId { get; set; }
        public bool IsLeader { get; set; } = false;

        // Navigation Properties
        public AssignmentGroup Group { get; set; } = null!;
        public User Student { get; set; } = null!;
    }
}
