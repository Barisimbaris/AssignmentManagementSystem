using AMS.Domain.Entities;
using AMS.Domain.Interfaces;
using AMS.Infrastructure.Data.Context;
using Microsoft.EntityFrameworkCore;

namespace AMS.Infrastructure.Data.Repositories
{
    public class GroupMemberRepository : IGroupMemberRepository
    {
        private readonly AMSDbContext _context;

        public GroupMemberRepository(AMSDbContext context)
        {
            _context = context;
        }

        public async Task<GroupMember?> GetByIdAsync(int id)
        {
            return await _context.GroupMembers
                .Include(gm => gm.Group)
                .Include(gm => gm.Student)
                .FirstOrDefaultAsync(gm => gm.Id == id);
        }

        public async Task<List<GroupMember>> GetAllAsync()
        {
            return await _context.GroupMembers
                .Include(gm => gm.Group)
                .Include(gm => gm.Student)
                .ToListAsync();
        }

        public async Task<AssignmentGroup?> GetStudentGroupAsync(int assignmentId, int studentId)
        {
            var groupMember = await _context.GroupMembers
                .Include(gm => gm.Group)
                    .ThenInclude(g => g.Assignment)
                .Include(gm => gm.Group)
                    .ThenInclude(g => g.Members)
                        .ThenInclude(m => m.Student)
                .FirstOrDefaultAsync(gm => gm.StudentId == studentId && gm.Group.AssignmentId == assignmentId);

            return groupMember?.Group;
        }

        public async Task<List<GroupMember>> GetGroupMembersAsync(int groupId)
        {
            return await _context.GroupMembers
                .Include(gm => gm.Student)
                .Where(gm => gm.GroupId == groupId)
                .OrderBy(gm => gm.IsLeader ? 0 : 1) // Leader önce
                .ThenBy(gm => gm.Student.StudentNumber)
                .ToListAsync();
        }

        public async Task<bool> IsStudentInGroupAsync(int assignmentId, int studentId)
        {
            return await _context.GroupMembers
                .Include(gm => gm.Group)
                .AnyAsync(gm => gm.StudentId == studentId && gm.Group.AssignmentId == assignmentId);
        }

        public async Task<List<GroupMember>> GetStudentGroupsInClassAsync(int classId, int studentId)
        {
            return await _context.GroupMembers
                .Include(gm => gm.Group)
                    .ThenInclude(g => g.Assignment)
                .Where(gm => gm.StudentId == studentId && gm.Group.Assignment.ClassId == classId)
                .ToListAsync();
        }

        public async Task<GroupMember> AddAsync(GroupMember groupMember)
        {
            await _context.GroupMembers.AddAsync(groupMember);
            return groupMember;
        }

        public async Task UpdateAsync(GroupMember groupMember)
        {
            _context.GroupMembers.Update(groupMember);
            await Task.CompletedTask;
        }

        public async Task DeleteAsync(GroupMember groupMember)
        {
            _context.GroupMembers.Remove(groupMember);
            await Task.CompletedTask;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}