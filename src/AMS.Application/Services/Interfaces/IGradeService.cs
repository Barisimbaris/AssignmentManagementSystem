using AMS.Application.Common.Results;
using AMS.Application.DTOs.Grade;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.Services.Interfaces
{
    public interface IGradeService
    {
        Task<Result<GradeResponseDto>> GetByIdAsync(int id);
        Task<Result<GradeResponseDto>> GetBySubmissionIdAsync(int submissionId);
        Task<Result<List<GradeResponseDto>>> GetByStudentIdAsync(int studentId);
        Task<Result<List<GradeResponseDto>>> GetByClassIdAsync(int classId);
        Task<Result<GradeResponseDto>> CreateAsync(CreateGradeRequestDto request, int instructorId);
        Task<Result<GradeResponseDto>> UpdateAsync(int id, UpdateGradeRequestDto request, int instructorId);
        Task<Result> PublishGradesAsync(List<int> gradeIds, int instructorId);
        Task<Result> DeleteAsync(int id, int instructorId);
    }
}
