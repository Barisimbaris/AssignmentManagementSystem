using AMS.Domain.Entities;

namespace AMS.Domain.Interfaces
{
    public interface IGroupMemberRepository
    {
        Task<GroupMember?> GetByIdAsync(int id);
        Task<List<GroupMember>> GetAllAsync();
        Task<AssignmentGroup?> GetStudentGroupAsync(int assignmentId, int studentId);
        Task<List<GroupMember>> GetGroupMembersAsync(int groupId);
        Task<bool> IsStudentInGroupAsync(int assignmentId, int studentId);
        Task<List<GroupMember>> GetStudentGroupsInClassAsync(int classId, int studentId);
        Task<GroupMember> AddAsync(GroupMember groupMember);
        Task UpdateAsync(GroupMember groupMember);
        Task DeleteAsync(GroupMember groupMember);
        Task SaveChangesAsync();
    }
}