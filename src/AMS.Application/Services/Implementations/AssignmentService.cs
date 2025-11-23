using AMS.Application.Common.Exceptions;
using AMS.Application.Common.Results;
using AMS.Application.DTOs.Assignment;
using AMS.Application.Services.Interfaces;
using AMS.Domain.Entities;
using AMS.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.Services.Implementations
{
    public class AssignmentService : IAssignmentService
    {
        private readonly IAssignmentRepository _assignmentRepository;
        private readonly IClassRepository _classRepository;
        private readonly ISubmissionRepository _submissionRepository;

        public AssignmentService(
            IAssignmentRepository assignmentRepository,
            IClassRepository classRepository,
            ISubmissionRepository submissionRepository)
        {
            _assignmentRepository = assignmentRepository;
            _classRepository = classRepository;
            _submissionRepository = submissionRepository;
        }

        public async Task<Result<AssignmentResponseDto>> GetByIdAsync(int id)
        {
            var assignment = await _assignmentRepository.GetByIdAsync(id);

            if (assignment == null)
            {
                throw new NotFoundException("Assignment", id);
            }

            var submissions = await _submissionRepository.GetByAssignmentIdAsync(id);

            var response = new AssignmentResponseDto
            {
                Id = assignment.Id,
                Title = assignment.Title,
                Description = assignment.Description,
                ClassId = assignment.ClassId,
                ClassName = assignment.Class.ClassName,
                AssignmentType = assignment.Type.ToString(),
                DueDate = assignment.DueDate,
                MaxScore = assignment.MaxScore,
                AllowLateSubmission = assignment.AllowLateSubmission,
                AllowResubmission = assignment.AllowResubmission,
                AttachmentPath = assignment.AttachmentPath,
                TotalSubmissions = submissions.Count,
                CreatedAt = assignment.CreatedAt
            };

            return Result<AssignmentResponseDto>.Success(response);
        }

        public async Task<Result<List<AssignmentResponseDto>>> GetAllAsync()
        {
            var assignments = await _assignmentRepository.GetAllAsync();

            var response = new List<AssignmentResponseDto>();

            foreach (var a in assignments)
            {
                var submissions = await _submissionRepository.GetByAssignmentIdAsync(a.Id);

                response.Add(new AssignmentResponseDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Description = a.Description,
                    ClassId = a.ClassId,
                    ClassName = a.Class.ClassName,
                    AssignmentType = a.Type.ToString(),
                    DueDate = a.DueDate,
                    MaxScore = a.MaxScore,
                    AllowLateSubmission = a.AllowLateSubmission,
                    AllowResubmission = a.AllowResubmission,
                    AttachmentPath = a.AttachmentPath,
                    TotalSubmissions = submissions.Count,
                    CreatedAt = a.CreatedAt
                });
            }

            return Result<List<AssignmentResponseDto>>.Success(response);
        }

        public async Task<Result<List<AssignmentResponseDto>>> GetByClassIdAsync(int classId)
        {
            var assignments = await _assignmentRepository.GetByClassIdAsync(classId);

            var response = new List<AssignmentResponseDto>();

            foreach (var a in assignments)
            {
                var submissions = await _submissionRepository.GetByAssignmentIdAsync(a.Id);

                response.Add(new AssignmentResponseDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Description = a.Description,
                    ClassId = a.ClassId,
                    ClassName = a.Class?.ClassName ?? "",
                    AssignmentType = a.Type.ToString(),
                    DueDate = a.DueDate,
                    MaxScore = a.MaxScore,
                    AllowLateSubmission = a.AllowLateSubmission,
                    AllowResubmission = a.AllowResubmission,
                    AttachmentPath = a.AttachmentPath,
                    TotalSubmissions = submissions.Count,
                    CreatedAt = a.CreatedAt
                });
            }

            return Result<List<AssignmentResponseDto>>.Success(response);
        }

        public async Task<Result<List<AssignmentResponseDto>>> GetByStudentIdAsync(int studentId)
        {
            var submissions = await _submissionRepository.GetByStudentIdAsync(studentId);
            var assignmentIds = submissions.Select(s => s.AssignmentId).Distinct().ToList();

            var response = new List<AssignmentResponseDto>();

            foreach (var assignmentId in assignmentIds)
            {
                var assignment = await _assignmentRepository.GetByIdAsync(assignmentId);
                if (assignment == null) continue;

                var allSubmissions = await _submissionRepository.GetByAssignmentIdAsync(assignmentId);

                response.Add(new AssignmentResponseDto
                {
                    Id = assignment.Id,
                    Title = assignment.Title,
                    Description = assignment.Description,
                    ClassId = assignment.ClassId,
                    ClassName = assignment.Class.ClassName,
                    AssignmentType = assignment.Type.ToString(),
                    DueDate = assignment.DueDate,
                    MaxScore = assignment.MaxScore,
                    AllowLateSubmission = assignment.AllowLateSubmission,
                    AllowResubmission = assignment.AllowResubmission,
                    AttachmentPath = assignment.AttachmentPath,
                    TotalSubmissions = allSubmissions.Count,
                    CreatedAt = assignment.CreatedAt
                });
            }

            return Result<List<AssignmentResponseDto>>.Success(response);
        }

        public async Task<Result<AssignmentResponseDto>> CreateAsync(CreateAssignmentRequestDto request, int instructorId)
        {
            var classEntity = await _classRepository.GetByIdAsync(request.ClassId);

            if (classEntity == null)
            {
                throw new NotFoundException("Class", request.ClassId);
            }

            if (classEntity.InstructorId != instructorId)
            {
                throw new UnauthorizedException("Only the class instructor can create assignments");
            }

            var assignment = new Assignment
            {
                Title = request.Title,
                Description = request.Description,
                ClassId = request.ClassId,
                Type = request.Type,
                DueDate = request.DueDate,
                MaxScore = request.MaxScore,
                AllowLateSubmission = request.AllowLateSubmission,
                AllowResubmission = request.AllowResubmission,
                CreatedAt = DateTime.UtcNow
            };

            await _assignmentRepository.AddAsync(assignment);
            await _assignmentRepository.SaveChangesAsync();

            var response = new AssignmentResponseDto
            {
                Id = assignment.Id,
                Title = assignment.Title,
                Description = assignment.Description,
                ClassId = assignment.ClassId,
                ClassName = classEntity.ClassName,
                AssignmentType = assignment.Type.ToString(),
                DueDate = assignment.DueDate,
                MaxScore = assignment.MaxScore,
                AllowLateSubmission = assignment.AllowLateSubmission,
                AllowResubmission = assignment.AllowResubmission,
                AttachmentPath = assignment.AttachmentPath,
                TotalSubmissions = 0,
                CreatedAt = assignment.CreatedAt
            };

            return Result<AssignmentResponseDto>.Success(response, "Assignment created successfully");
        }

        public async Task<Result<AssignmentResponseDto>> UpdateAsync(int id, UpdateAssignmentRequestDto request, int instructorId)
        {
            var assignment = await _assignmentRepository.GetByIdAsync(id);

            if (assignment == null)
            {
                throw new NotFoundException("Assignment", id);
            }

            if (assignment.Class.InstructorId != instructorId)
            {
                throw new UnauthorizedException("Only the class instructor can update this assignment");
            }

            if (!string.IsNullOrEmpty(request.Title))
                assignment.Title = request.Title;

            if (!string.IsNullOrEmpty(request.Description))
                assignment.Description = request.Description;

            if (request.DueDate.HasValue)
                assignment.DueDate = request.DueDate.Value;

            if (request.MaxScore.HasValue)
                assignment.MaxScore = request.MaxScore.Value;

            if (request.AllowLateSubmission.HasValue)
                assignment.AllowLateSubmission = request.AllowLateSubmission.Value;

            if (request.AllowResubmission.HasValue)
                assignment.AllowResubmission = request.AllowResubmission.Value;

            assignment.UpdatedAt = DateTime.UtcNow;

            await _assignmentRepository.UpdateAsync(assignment);
            await _assignmentRepository.SaveChangesAsync();

            var submissions = await _submissionRepository.GetByAssignmentIdAsync(id);

            var response = new AssignmentResponseDto
            {
                Id = assignment.Id,
                Title = assignment.Title,
                Description = assignment.Description,
                ClassId = assignment.ClassId,
                ClassName = assignment.Class.ClassName,
                AssignmentType = assignment.Type.ToString(),
                DueDate = assignment.DueDate,
                MaxScore = assignment.MaxScore,
                AllowLateSubmission = assignment.AllowLateSubmission,
                AllowResubmission = assignment.AllowResubmission,
                AttachmentPath = assignment.AttachmentPath,
                TotalSubmissions = submissions.Count,
                CreatedAt = assignment.CreatedAt
            };

            return Result<AssignmentResponseDto>.Success(response, "Assignment updated successfully");
        }

        public async Task<Result> DeleteAsync(int id, int instructorId)
        {
            var assignment = await _assignmentRepository.GetByIdAsync(id);

            if (assignment == null)
            {
                throw new NotFoundException("Assignment", id);
            }

            if (assignment.Class.InstructorId != instructorId)
            {
                throw new UnauthorizedException("Only the class instructor can delete this assignment");
            }

            await _assignmentRepository.DeleteAsync(assignment);
            await _assignmentRepository.SaveChangesAsync();

            return Result.Success("Assignment deleted successfully");
        }
    }
}
