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
    public class AssignmentRepository : IAssignmentRepository
    {
        private readonly AMSDbContext _context;

        public AssignmentRepository(AMSDbContext context)
        {
            _context = context;
        }

        public async Task<Assignment?> GetByIdAsync(int id)
        {
            return await _context.Assignments
                .Include(a => a.Class)
                .ThenInclude(c => c.Course)
                .FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task<List<Assignment>> GetAllAsync()
        {
            return await _context.Assignments
                .Include(a => a.Class)
                .ToListAsync();
        }

        public async Task<List<Assignment>> GetByClassIdAsync(int classId)
        {
            return await _context.Assignments
               .Include(a => a.Class)
        .Include(a => a.Submissions)
        .Where(a => a.ClassId == classId)
        .OrderByDescending(a => a.CreatedAt)
        .ToListAsync();
        }

        public async Task<Assignment> AddAsync(Assignment assignment)
        {
            await _context.Assignments.AddAsync(assignment);
            return assignment;
        }

        public Task UpdateAsync(Assignment assignment)
        {
            _context.Assignments.Update(assignment);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(Assignment assignment)
        {
            assignment.IsDeleted = true;
            assignment.UpdatedAt = DateTime.UtcNow;
            return Task.CompletedTask;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
        public async Task<List<Assignment>> GetByClassIdsAsync(List<int> classIds)
        {
            return await _context.Assignments
                .Include(a => a.Class)
                .Include(a => a.Submissions)
                .Where(a => classIds.Contains(a.ClassId))
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();
        }
    }
}
