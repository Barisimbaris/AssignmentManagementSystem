using AMS.Domain.Entities;
using AMS.Domain.Common.Interfaces;

namespace AMS.Domain.Interfaces
{
    public interface ILessonPlanRepository : IRepository<LessonPlan>
    {
        Task<List<LessonPlan>> GetByClassIdAsync(int classId);
        Task<List<LessonPlan>> GetByInstructorIdAsync(int instructorId);
    }
}


