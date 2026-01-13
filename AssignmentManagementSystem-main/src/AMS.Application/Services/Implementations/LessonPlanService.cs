using AMS.Application.Common.Exceptions;
using AMS.Application.Common.Results;
using AMS.Application.DTOs.LessonPlan;
using AMS.Application.Services.Interfaces;
using AMS.Domain.Entities;
using AMS.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AMS.Application.Services.Implementations
{
    public class LessonPlanService : ILessonPlanService
    {
        private readonly ILessonPlanRepository _lessonPlanRepository;
        private readonly IClassRepository _classRepository;

        public LessonPlanService(
            ILessonPlanRepository lessonPlanRepository,
            IClassRepository classRepository)
        {
            _lessonPlanRepository = lessonPlanRepository;
            _classRepository = classRepository;
        }

        public async Task<Result<LessonPlanResponseDto>> GetByIdAsync(int id)
        {
            var lessonPlan = await _lessonPlanRepository.GetByIdAsync(id);
            if (lessonPlan == null)
            {
                throw new NotFoundException("LessonPlan", id);
            }

            var response = MapToDto(lessonPlan);
            return Result<LessonPlanResponseDto>.Success(response);
        }

        public async Task<Result<List<LessonPlanResponseDto>>> GetByClassIdAsync(int classId)
        {
            var lessonPlans = await _lessonPlanRepository.GetByClassIdAsync(classId);
            var response = lessonPlans.Select(MapToDto).ToList();
            return Result<List<LessonPlanResponseDto>>.Success(response);
        }

        public async Task<Result<List<LessonPlanResponseDto>>> GetByInstructorIdAsync(int instructorId)
        {
            var lessonPlans = await _lessonPlanRepository.GetByInstructorIdAsync(instructorId);
            var response = lessonPlans.Select(MapToDto).ToList();
            return Result<List<LessonPlanResponseDto>>.Success(response);
        }

        public async Task<Result<LessonPlanResponseDto>> CreateAsync(CreateLessonPlanRequestDto request, int instructorId)
        {
            var classEntity = await _classRepository.GetByIdAsync(request.ClassId);
            if (classEntity == null)
            {
                throw new NotFoundException("Class", request.ClassId);
            }

            if (classEntity.InstructorId != instructorId)
            {
                return Result<LessonPlanResponseDto>.Failure("You don't have permission to create lesson plan for this class");
            }

            if (request.EndDate <= request.StartDate)
            {
                return Result<LessonPlanResponseDto>.Failure("End date must be after start date");
            }

            var lessonPlan = new LessonPlan
            {
                ClassId = request.ClassId,
                WeekNumber = request.WeekNumber,
                Topic = request.Topic.Trim(),
                Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = null,
                // IsDeleted alanını açıkça false olarak set ediyoruz ki NULL gitmesin.
                // Bazı ortamlarda veritabanı varsayılan değeri güncellenmemiş olabilir.
                IsDeleted = false
            };

            try
            {
                await _lessonPlanRepository.AddAsync(lessonPlan);
                await _lessonPlanRepository.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Log the full exception details
                var errorMessage = $"Error saving lesson plan: {ex.Message}";
                if (ex.InnerException != null)
                {
                    errorMessage += $" Inner: {ex.InnerException.Message}";
                }
                return Result<LessonPlanResponseDto>.Failure(errorMessage);
            }

            // Refresh entity to load navigation properties
            var savedLessonPlan = await _lessonPlanRepository.GetByIdAsync(lessonPlan.Id);
            if (savedLessonPlan == null)
            {
                throw new NotFoundException("LessonPlan", lessonPlan.Id);
            }

            var response = MapToDto(savedLessonPlan);
            return Result<LessonPlanResponseDto>.Success(response, "Lesson plan created successfully");
        }

        public async Task<Result<LessonPlanResponseDto>> UpdateAsync(int id, UpdateLessonPlanRequestDto request, int instructorId)
        {
            var lessonPlan = await _lessonPlanRepository.GetByIdAsync(id);
            if (lessonPlan == null)
            {
                throw new NotFoundException("LessonPlan", id);
            }

            if (lessonPlan.Class.InstructorId != instructorId)
            {
                return Result<LessonPlanResponseDto>.Failure("You don't have permission to update this lesson plan");
            }

            if (request.WeekNumber.HasValue)
                lessonPlan.WeekNumber = request.WeekNumber.Value;

            if (!string.IsNullOrEmpty(request.Topic))
                lessonPlan.Topic = request.Topic;

            if (request.Description != null)
                lessonPlan.Description = request.Description;

            if (request.StartDate.HasValue)
                lessonPlan.StartDate = request.StartDate.Value;

            if (request.EndDate.HasValue)
                lessonPlan.EndDate = request.EndDate.Value;

            if (request.EndDate.HasValue && request.StartDate.HasValue && request.EndDate.Value <= request.StartDate.Value)
            {
                return Result<LessonPlanResponseDto>.Failure("End date must be after start date");
            }

            lessonPlan.UpdatedAt = DateTime.UtcNow;
            await _lessonPlanRepository.UpdateAsync(lessonPlan);
            await _lessonPlanRepository.SaveChangesAsync();

            var response = MapToDto(lessonPlan);
            return Result<LessonPlanResponseDto>.Success(response, "Lesson plan updated successfully");
        }

        public async Task<Result> DeleteAsync(int id, int instructorId)
        {
            var lessonPlan = await _lessonPlanRepository.GetByIdAsync(id);
            if (lessonPlan == null)
            {
                throw new NotFoundException("LessonPlan", id);
            }

            if (lessonPlan.Class.InstructorId != instructorId)
            {
                return Result.Failure("You don't have permission to delete this lesson plan");
            }

            await _lessonPlanRepository.DeleteAsync(lessonPlan);
            await _lessonPlanRepository.SaveChangesAsync();

            return Result.Success("Lesson plan deleted successfully");
        }

        private LessonPlanResponseDto MapToDto(LessonPlan lessonPlan)
        {
            return new LessonPlanResponseDto
            {
                Id = lessonPlan.Id,
                ClassId = lessonPlan.ClassId,
                ClassName = lessonPlan.Class?.ClassName ?? string.Empty,
                CourseCode = lessonPlan.Class?.Course?.CourseCode ?? string.Empty,
                WeekNumber = lessonPlan.WeekNumber,
                Topic = lessonPlan.Topic,
                Description = lessonPlan.Description,
                StartDate = lessonPlan.StartDate,
                EndDate = lessonPlan.EndDate,
                CreatedAt = lessonPlan.CreatedAt,
                UpdatedAt = lessonPlan.UpdatedAt
            };
        }
    }
}

