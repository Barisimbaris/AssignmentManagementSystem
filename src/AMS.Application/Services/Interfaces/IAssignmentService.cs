using AMS.Application.Common.Results;
using AMS.Application.DTOs.Assignment;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.Services.Interfaces
{
    public interface IAssignmentService
    {
        Task<Result<AssignmentResponseDto>> GetByIdAsync(int id);
        Task<Result<List<AssignmentResponseDto>>> GetAllAsync();
        Task<Result<List<AssignmentResponseDto>>> GetByClassIdAsync(int classId);
        Task<Result<List<AssignmentResponseDto>>> GetByStudentIdAsync(int studentId);
        Task<Result<AssignmentResponseDto>> CreateAsync(CreateAssignmentRequestDto request, int userId);
        Task<Result<AssignmentResponseDto>> UpdateAsync(int id, UpdateAssignmentRequestDto request, int userId);
        Task<Result> DeleteAsync(int id, int userId);
        Task<Result<List<AssignmentResponseDto>>> GetByInstructorIdAsync(int instructorId); // ✅ EKLE
        
    }
}
