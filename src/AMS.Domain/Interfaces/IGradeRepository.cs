using AMS.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Domain.Interfaces
{
    public interface IGradeRepository
    {
        Task<Grade?> GetByIdAsync(int id);
        Task<Grade?> GetBySubmissionIdAsync(int submissionId);
        Task<List<Grade>> GetByStudentIdAsync(int studentId);
        Task<List<Grade>> GetByClassIdAsync(int classId);
        Task<List<Grade>> GetByIdsAsync(List<int> ids);
        Task<Grade> AddAsync(Grade grade);
        Task UpdateAsync(Grade grade);
        Task DeleteAsync(Grade grade);
        Task SaveChangesAsync();
    }
}
