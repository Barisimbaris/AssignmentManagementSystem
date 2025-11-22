using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.DTOs.Grade
{
    public class PublishGradesRequestDto
    {
        public List<int> GradeIds { get; set; } = new();
    }
}
