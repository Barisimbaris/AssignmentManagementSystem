using AMS.Domain.Entities;
using AMS.Domain.Interfaces;
using AMS.Infrastructure.Data.Context;
using Microsoft.EntityFrameworkCore;

namespace AMS.Infrastructure.Data.Repositories
{
    public class AssignmentGroupRepository : IAssignmentGroupRepository
    {
        private readonly AMSDbContext _context;

        public AssignmentGroupRepository(AMSDbContext context)
        {
            _context = context;
        }

        public async Task<AssignmentGroup?> GetByIdAsync(int id)
        {
            return await _context.AssignmentGroups
                .Include(ag => ag.Assignment)
                .Include(ag => ag.Members)
                    .ThenInclude(m => m.Student)
                .FirstOrDefaultAsync(ag => ag.Id == id);
        }

        public async Task<List<AssignmentGroup>> GetAllAsync()
        {
            return await _context.AssignmentGroups
                .Include(ag => ag.Assignment)
                .Include(ag => ag.Members)
                    .ThenInclude(m => m.Student)
                .ToListAsync();
        }

        public async Task<List<AssignmentGroup>> GetByAssignmentIdAsync(int assignmentId)
        {
            return await _context.AssignmentGroups
                .Include(ag => ag.Assignment)
                .Include(ag => ag.Members)
                    .ThenInclude(m => m.Student)
                .Where(ag => ag.AssignmentId == assignmentId)
                .OrderBy(ag => ag.GroupName)
                .ToListAsync();
        }

        public async Task<AssignmentGroup?> GetGroupWithMembersAsync(int groupId)
        {
            return await _context.AssignmentGroups
                .Include(ag => ag.Assignment)
                    .ThenInclude(a => a.Class)
                .Include(ag => ag.Members)
                    .ThenInclude(m => m.Student)
                .FirstOrDefaultAsync(ag => ag.Id == groupId);
        }

        public async Task<bool> ExistsByNameAndAssignmentAsync(string groupName, int assignmentId)
        {
            return await _context.AssignmentGroups
                .AnyAsync(ag => ag.GroupName == groupName && ag.AssignmentId == assignmentId);
        }

        public async Task<AssignmentGroup> AddAsync(AssignmentGroup assignmentGroup)
        {
            await _context.AssignmentGroups.AddAsync(assignmentGroup);
            return assignmentGroup;
        }

        public async Task UpdateAsync(AssignmentGroup assignmentGroup)
        {
            _context.AssignmentGroups.Update(assignmentGroup);
            await Task.CompletedTask;
        }

        public async Task DeleteAsync(AssignmentGroup assignmentGroup)
        {
            _context.AssignmentGroups.Remove(assignmentGroup);
            await Task.CompletedTask;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}