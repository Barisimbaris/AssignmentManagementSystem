using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.DTOs.Class
{
    public class UpdateClassRequestDto
    {
        public string? ClassName { get; set; }
        public int? MaxCapacity { get; set; }
        public int? InstructorId { get; set; }
    }
}
