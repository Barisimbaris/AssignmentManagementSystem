using AMS.Domain.Entities;
using AMS.Domain.Interfaces;
using AMS.Infrastructure.Data.Context;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Infrastructure.Data.Repositories
{
    public class EnrollmentRepository : IEnrollmentRepository
    {
        private readonly AMSDbContext _context;

        public EnrollmentRepository(AMSDbContext context)
        {
            _context = context;
        }

        public async Task<Enrollment?> GetByIdAsync(int id)
        {
            return await _context.Enrollments
                .Include(e => e.Student)
                .Include(e => e.Class)
                .ThenInclude(c => c.Course)
                .FirstOrDefaultAsync(e => e.Id == id);
        }

        public async Task<Enrollment?> GetByStudentAndClassAsync(int studentId, int classId)
        {
            return await _context.Enrollments
                .FirstOrDefaultAsync(e => e.StudentId == studentId && e.ClassId == classId);
        }

        public async Task<List<Enrollment>> GetByStudentIdAsync(int studentId)
        {
            return await _context.Enrollments
                .Include(e => e.Class)
                .ThenInclude(c => c.Course)
                .Where(e => e.StudentId == studentId)
                .ToListAsync();
        }

        public async Task<List<Enrollment>> GetByClassIdAsync(int classId)
        {
            return await _context.Enrollments
                .Include(e => e.Student)
                .Where(e => e.ClassId == classId)
                .ToListAsync();
        }

        public async Task<int> GetEnrollmentCountByClassIdAsync(int classId)
        {
            return await _context.Enrollments
                .CountAsync(e => e.ClassId == classId && e.IsActive);
        }

        public async Task<Enrollment> AddAsync(Enrollment enrollment)
        {
            await _context.Enrollments.AddAsync(enrollment);
            return enrollment;
        }

        public Task UpdateAsync(Enrollment enrollment)
        {
            _context.Enrollments.Update(enrollment);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(Enrollment enrollment)
        {
            enrollment.IsDeleted = true;
            enrollment.UpdatedAt = DateTime.UtcNow;
            return Task.CompletedTask;
        }

        public async Task<bool> IsStudentEnrolledAsync(int studentId, int classId)
        {
            return await _context.Enrollments
                .AnyAsync(e => e.StudentId == studentId && e.ClassId == classId && e.IsActive);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
