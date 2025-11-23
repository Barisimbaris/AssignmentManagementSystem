using AMS.Application.Common.Results;
using AMS.Application.DTOs.Submission;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.Services.Interfaces
{
    public interface ISubmissionService
    {

        Task<Result<SubmissionResponseDto>> GetByIdAsync(int id);
        Task<Result<List<SubmissionResponseDto>>> GetByAssignmentIdAsync(int assignmentId);
        Task<Result<List<SubmissionResponseDto>>> GetByStudentIdAsync(int studentId);
        Task<Result<SubmissionResponseDto>> SubmitAsync(CreateSubmissionRequestDto request, int studentId, string filePath);
        Task<Result<SubmissionResponseDto>> ResubmitAsync(int submissionId, int studentId, string filePath);
        Task<Result> DeleteAsync(int id, int studentId);
    }
}
