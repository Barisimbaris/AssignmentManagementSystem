using AMS.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Domain.Interfaces
{
    public interface ICourseInstructorRepository
    {
        Task<CourseInstructor?> GetByIdAsync(int id);
        Task<CourseInstructor?> GetByCourseAndInstructorAsync(int courseId, int instructorId);
        Task<List<CourseInstructor>> GetByCourseIdAsync(int courseId);
        Task<List<CourseInstructor>> GetByInstructorIdAsync(int instructorId);
        Task<bool> IsAssignedAsync(int courseId, int instructorId);
        Task<CourseInstructor> AddAsync(CourseInstructor courseInstructor);
        Task DeleteAsync(CourseInstructor courseInstructor);
        Task SaveChangesAsync();
    }
}