using AMS.Domain.Common;
using AMS.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Domain.Entities
{
    public class Assignment : BaseEntity
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int ClassId { get; set; }
        public AssignmentType Type { get; set; }
        public DateTime DueDate { get; set; }
        public int MaxScore { get; set; } = 100;
        public bool AllowLateSubmission { get; set; } = false;
        public bool AllowResubmission { get; set; } = false;
        public string? AttachmentPath { get; set; }

        // Navigation Properties
        public Class Class { get; set; } = null!;
        public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
        public ICollection<AssignmentGroup> AssignmentGroups { get; set; } = new List<AssignmentGroup>();
    }
}
