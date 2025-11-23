using AMS.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Domain.Interfaces
{
    public interface ISubmissionRepository
    {
        Task<Submission?> GetByIdAsync(int id);
        Task<List<Submission>> GetByAssignmentIdAsync(int assignmentId);
        Task<List<Submission>> GetByStudentIdAsync(int studentId);
        Task<Submission?> GetByAssignmentAndStudentAsync(int assignmentId, int studentId);
        Task<Submission> AddAsync(Submission submission);
        Task UpdateAsync(Submission submission);
        Task DeleteAsync(Submission submission);
        Task SaveChangesAsync();
    }
}
