using AMS.Application.Common.Exceptions;
using AMS.Application.Common.Results;
using AMS.Application.DTOs.Submission;
using AMS.Application.Services.Interfaces;
using AMS.Domain.Entities;
using AMS.Domain.Enums;
using AMS.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.Services.Implementations
{
    public class SubmissionService : ISubmissionService
    {
        private readonly ISubmissionRepository _submissionRepository;
        private readonly IAssignmentRepository _assignmentRepository;
        private readonly IUserRepository _userRepository;

        public SubmissionService(
            ISubmissionRepository submissionRepository,
            IAssignmentRepository assignmentRepository,
            IUserRepository userRepository)
        {
            _submissionRepository = submissionRepository;
            _assignmentRepository = assignmentRepository;
            _userRepository = userRepository;
        }

        public async Task<Result<SubmissionResponseDto>> GetByIdAsync(int id)
        {
            var submission = await _submissionRepository.GetByIdAsync(id);

            if (submission == null)
            {
                throw new NotFoundException("Submission", id);
            }

            var response = new SubmissionResponseDto
            {
                Id = submission.Id,
                AssignmentId = submission.AssignmentId,
                AssignmentTitle = submission.Assignment.Title,
                StudentId = submission.StudentId,
                StudentName = $"{submission.Student.FirstName} {submission.Student.LastName}",
                FilePath = submission.FilePath,
                FileType = submission.FileType.ToString(),
                FileSizeInBytes = submission.FileSizeInBytes,
                SubmittedAt = submission.SubmittedAt,
                Status = submission.Status.ToString(),
                IsLate = submission.IsLate,
                Comments = submission.Comments,
                Score = submission.Grade?.Score,
                Feedback = submission.Grade?.Feedback
            };

            return Result<SubmissionResponseDto>.Success(response);
        }

        public async Task<Result<List<SubmissionResponseDto>>> GetByAssignmentIdAsync(int assignmentId)
        {
            var submissions = await _submissionRepository.GetByAssignmentIdAsync(assignmentId);

            var response = submissions.Select(s => new SubmissionResponseDto
            {
                Id = s.Id,
                AssignmentId = s.AssignmentId,
                AssignmentTitle = s.Assignment.Title,
                StudentId = s.StudentId,
                StudentName = $"{s.Student.FirstName} {s.Student.LastName}",
                FilePath = s.FilePath,
                FileType = s.FileType.ToString(),
                FileSizeInBytes = s.FileSizeInBytes,
                SubmittedAt = s.SubmittedAt,
                Status = s.Status.ToString(),
                IsLate = s.IsLate,
                Comments = s.Comments,
                Score = s.Grade?.Score,
                Feedback = s.Grade?.Feedback
            }).ToList();

            return Result<List<SubmissionResponseDto>>.Success(response);
        }

        public async Task<Result<List<SubmissionResponseDto>>> GetByStudentIdAsync(int studentId)
        {
            var submissions = await _submissionRepository.GetByStudentIdAsync(studentId);

            var response = submissions.Select(s => new SubmissionResponseDto
            {
                Id = s.Id,
                AssignmentId = s.AssignmentId,
                AssignmentTitle = s.Assignment.Title,
                StudentId = s.StudentId,
                StudentName = $"{s.Student.FirstName} {s.Student.LastName}",
                FilePath = s.FilePath,
                FileType = s.FileType.ToString(),
                FileSizeInBytes = s.FileSizeInBytes,
                SubmittedAt = s.SubmittedAt,
                Status = s.Status.ToString(),
                IsLate = s.IsLate,
                Comments = s.Comments,
                Score = s.Grade?.Score,
                Feedback = s.Grade?.Feedback
            }).ToList();

            return Result<List<SubmissionResponseDto>>.Success(response);
        }

        public async Task<Result<SubmissionResponseDto>> SubmitAsync(CreateSubmissionRequestDto request, int studentId, string filePath)
        {
            var assignment = await _assignmentRepository.GetByIdAsync(request.AssignmentId);

            if (assignment == null)
            {
                throw new NotFoundException("Assignment", request.AssignmentId);
            }

            var existingSubmission = await _submissionRepository.GetByAssignmentAndStudentAsync(request.AssignmentId, studentId);

            if (existingSubmission != null && !assignment.AllowResubmission)
            {
                return Result<SubmissionResponseDto>.Failure("Resubmission is not allowed for this assignment");
            }

            var isLate = DateTime.UtcNow > assignment.DueDate;

            if (isLate && !assignment.AllowLateSubmission)
            {
                return Result<SubmissionResponseDto>.Failure("Late submission is not allowed for this assignment");
            }

            var fileInfo = new FileInfo(filePath);

            var submission = new Submission
            {
                AssignmentId = request.AssignmentId,
                StudentId = studentId,
                GroupId = request.GroupId,
                FilePath = filePath,
                FileType = GetFileType(fileInfo.Extension),
                FileSizeInBytes = fileInfo.Length,
                SubmittedAt = DateTime.UtcNow,
                Status = SubmissionStatus.Submitted,
                IsLate = isLate,
                Comments = request.Comments,
                CreatedAt = DateTime.UtcNow
            };

            await _submissionRepository.AddAsync(submission);
            await _submissionRepository.SaveChangesAsync();

            var student = await _userRepository.GetByIdAsync(studentId);

            var response = new SubmissionResponseDto
            {
                Id = submission.Id,
                AssignmentId = submission.AssignmentId,
                AssignmentTitle = assignment.Title,
                StudentId = submission.StudentId,
                StudentName = $"{student!.FirstName} {student.LastName}",
                FilePath = submission.FilePath,
                FileType = submission.FileType.ToString(),
                FileSizeInBytes = submission.FileSizeInBytes,
                SubmittedAt = submission.SubmittedAt,
                Status = submission.Status.ToString(),
                IsLate = submission.IsLate,
                Comments = submission.Comments
            };

            return Result<SubmissionResponseDto>.Success(response, "Submission uploaded successfully");
        }

        public async Task<Result<SubmissionResponseDto>> ResubmitAsync(int submissionId, int studentId, string filePath)
        {
            var submission = await _submissionRepository.GetByIdAsync(submissionId);

            if (submission == null)
            {
                throw new NotFoundException("Submission", submissionId);
            }

            if (submission.StudentId != studentId)
            {
                throw new UnauthorizedException("You can only resubmit your own submissions");
            }

            var assignment = await _assignmentRepository.GetByIdAsync(submission.AssignmentId);

            if (!assignment!.AllowResubmission)
            {
                return Result<SubmissionResponseDto>.Failure("Resubmission is not allowed for this assignment");
            }

            var fileInfo = new FileInfo(filePath);

            submission.FilePath = filePath;
            submission.FileType = GetFileType(fileInfo.Extension);
            submission.FileSizeInBytes = fileInfo.Length;
            submission.SubmittedAt = DateTime.UtcNow;
            submission.Status = SubmissionStatus.Resubmitted;
            submission.UpdatedAt = DateTime.UtcNow;

            await _submissionRepository.UpdateAsync(submission);
            await _submissionRepository.SaveChangesAsync();

            var response = new SubmissionResponseDto
            {
                Id = submission.Id,
                AssignmentId = submission.AssignmentId,
                AssignmentTitle = submission.Assignment.Title,
                StudentId = submission.StudentId,
                StudentName = $"{submission.Student.FirstName} {submission.Student.LastName}",
                FilePath = submission.FilePath,
                FileType = submission.FileType.ToString(),
                FileSizeInBytes = submission.FileSizeInBytes,
                SubmittedAt = submission.SubmittedAt,
                Status = submission.Status.ToString(),
                IsLate = submission.IsLate,
                Comments = submission.Comments,
                Score = submission.Grade?.Score,
                Feedback = submission.Grade?.Feedback
            };

            return Result<SubmissionResponseDto>.Success(response, "Resubmission uploaded successfully");
        }

        public async Task<Result> DeleteAsync(int id, int studentId)
        {
            var submission = await _submissionRepository.GetByIdAsync(id);

            if (submission == null)
            {
                throw new NotFoundException("Submission", id);
            }

            if (submission.StudentId != studentId)
            {
                throw new UnauthorizedException("You can only delete your own submissions");
            }

            await _submissionRepository.DeleteAsync(submission);
            await _submissionRepository.SaveChangesAsync();

            return Result.Success("Submission deleted successfully");
        }

        private FileType GetFileType(string extension)
        {
            return extension.ToLower() switch
            {
                ".pdf" => FileType.PDF,
                ".jpg" or ".jpeg" or ".png" or ".gif" => FileType.Image,
                _ => FileType.PDF
            };
        }
    }
}
