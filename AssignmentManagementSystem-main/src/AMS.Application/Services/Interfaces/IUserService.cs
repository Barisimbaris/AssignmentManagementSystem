using AMS.Application.Common.Results;
using AMS.Application.DTOs.User;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.Services.Interfaces
{
    public  interface IUserService
    {
        Task<Result<UserResponseDto>> GetByIdAsync(int id);
        Task<Result<UserResponseDto>> GetByEmailAsync(string email);
        Task<Result<List<UserResponseDto>>> GetAllAsync();
        Task<Result<List<UserResponseDto>>> GetStudentsAsync();
        Task<Result<List<UserResponseDto>>> GetInstructorsAsync();
        Task<Result<List<InstructorStudentsResponseDto>>> GetInstructorStudentsAsync(int instructorId);
        Task<Result<UserResponseDto>> UpdateAsync(int id, UpdateUserRequestDto request);
        Task<Result> ChangePasswordAsync(int userId, ChangePasswordRequestDto request);
        Task<Result> DeleteAsync(int id);

        // ✅ BULK IMPORT METHODS
        Task<Result<BulkImportResultDto>> BulkImportAsync(BulkImportRequestDto request);
    }
}
