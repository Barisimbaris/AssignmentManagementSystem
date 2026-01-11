using AMS.Application.Common.Results;
using AMS.Application.DTOs.Group;

namespace AMS.Application.Services.Interfaces
{
    public interface IGroupService
    {
        // Student operations
        Task<Result<GroupResponseDto>> CreateGroupAsync(CreateGroupRequestDto request, int leaderStudentId);
        Task<Result<GroupResponseDto?>> GetMyGroupAsync(int assignmentId, int studentId);
        Task<Result<List<AvailableStudentDto>>> GetAvailableStudentsAsync(int assignmentId, int currentStudentId);
        
        // Instructor operations  
        Task<Result<List<GroupResponseDto>>> GetAssignmentGroupsAsync(int assignmentId);
        Task<Result<List<GroupResponseDto>>> GetInstructorGroupsAsync(int assignmentId, int instructorId);
        Task<Result<GroupResponseDto>> GetGroupDetailsAsync(int groupId);
        
        // Validation
        Task<Result<bool>> CanCreateGroupAsync(int assignmentId, int studentId);
        Task<Result<bool>> IsStudentGroupLeaderAsync(int groupId, int studentId);
        
        // ? MOB?L ?Ç?N EKLEND? - Group leadership kontrolü
        Task<bool> IsUserGroupLeaderAsync(int groupId, int userId);
    }
}