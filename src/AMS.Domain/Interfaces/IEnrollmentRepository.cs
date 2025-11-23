using AMS.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Domain.Interfaces
{
    public interface IEnrollmentRepository
    {
        Task<Enrollment?> GetByIdAsync(int id);
        Task<Enrollment?> GetByStudentAndClassAsync(int studentId, int classId);
        Task<List<Enrollment>> GetByStudentIdAsync(int studentId);
        Task<List<Enrollment>> GetByClassIdAsync(int classId);
        Task<int> GetEnrollmentCountByClassIdAsync(int classId);
        Task<Enrollment> AddAsync(Enrollment enrollment);
        Task UpdateAsync(Enrollment enrollment);
        Task DeleteAsync(Enrollment enrollment);
        Task<bool> IsStudentEnrolledAsync(int studentId, int classId);
        Task SaveChangesAsync();
    }
}
