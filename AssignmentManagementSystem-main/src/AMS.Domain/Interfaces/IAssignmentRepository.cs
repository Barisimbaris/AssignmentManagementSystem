using AMS.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Domain.Interfaces
{
    public interface IAssignmentRepository
    {
        Task<Assignment?> GetByIdAsync(int id);
        Task<List<Assignment>> GetAllAsync();
        Task<List<Assignment>> GetByClassIdAsync(int classId);
        Task<Assignment> AddAsync(Assignment assignment);
        Task UpdateAsync(Assignment assignment);
        Task DeleteAsync(Assignment assignment);
        Task SaveChangesAsync();
        Task<List<Assignment>> GetByClassIdsAsync(List<int> classIds);
    }
}
