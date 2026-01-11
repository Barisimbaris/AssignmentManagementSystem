using AMS.Domain.Entities;

namespace AMS.Domain.Interfaces
{
    public interface IAssignmentGroupRepository
    {
        Task<AssignmentGroup?> GetByIdAsync(int id);
        Task<List<AssignmentGroup>> GetAllAsync();
        Task<List<AssignmentGroup>> GetByAssignmentIdAsync(int assignmentId);
        Task<AssignmentGroup?> GetGroupWithMembersAsync(int groupId);
        Task<bool> ExistsByNameAndAssignmentAsync(string groupName, int assignmentId);
        Task<AssignmentGroup> AddAsync(AssignmentGroup assignmentGroup);
        Task UpdateAsync(AssignmentGroup assignmentGroup);
        Task DeleteAsync(AssignmentGroup assignmentGroup);
        Task SaveChangesAsync();
    }
}