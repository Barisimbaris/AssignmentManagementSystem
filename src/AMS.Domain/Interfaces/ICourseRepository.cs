using AMS.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Domain.Interfaces
{
    public interface ICourseRepository
    {
        Task<Course?> GetByIdAsync(int id);
        Task<Course?> GetByCourseCodeAsync(string courseCode);
        Task<List<Course>> GetAllAsync();
        Task<List<Course>> GetByDepartmentAsync(string department);
        Task<Course> AddAsync(Course course);
        Task UpdateAsync(Course course);
        Task DeleteAsync(Course course);
        Task<bool> CourseCodeExistsAsync(string courseCode);
        Task SaveChangesAsync();
    }
}
