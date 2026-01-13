using AMS.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Domain.Interfaces
{
    public interface IClassRepository
    {
        Task<Class?> GetByIdAsync(int id);
        Task<List<Class>> GetAllAsync();
        Task<List<Class>> GetByCourseIdAsync(int courseId);
        Task<List<Class>> GetByInstructorIdAsync(int instructorId);
        Task<Class> AddAsync(Class classEntity);
        Task UpdateAsync(Class classEntity);
        Task DeleteAsync(Class classEntity);
        Task SaveChangesAsync();
        
    }
}
