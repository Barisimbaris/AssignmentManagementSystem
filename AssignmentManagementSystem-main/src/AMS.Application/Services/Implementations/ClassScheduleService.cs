using AMS.Application.Common.Exceptions;
using AMS.Application.Common.Results;
using AMS.Application.DTOs.ClassSchedule;
using AMS.Application.Services.Interfaces;
using AMS.Domain.Entities;
using AMS.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AMS.Application.Services.Implementations
{
    public class ClassScheduleService : IClassScheduleService
    {
        private readonly IClassScheduleRepository _scheduleRepository;
        private readonly IClassRepository _classRepository;

        public ClassScheduleService(
            IClassScheduleRepository scheduleRepository,
            IClassRepository classRepository)
        {
            _scheduleRepository = scheduleRepository;
            _classRepository = classRepository;
        }

        public async Task<Result<ClassScheduleResponseDto>> GetByIdAsync(int id)
        {
            var schedule = await _scheduleRepository.GetByIdAsync(id);
            if (schedule == null)
            {
                throw new NotFoundException("ClassSchedule", id);
            }

            var response = MapToDto(schedule);
            return Result<ClassScheduleResponseDto>.Success(response);
        }

        public async Task<Result<List<ClassScheduleResponseDto>>> GetByClassIdAsync(int classId)
        {
            var schedules = await _scheduleRepository.GetByClassIdAsync(classId);
            var response = schedules.Select(MapToDto).ToList();
            return Result<List<ClassScheduleResponseDto>>.Success(response);
        }

        public async Task<Result<List<ClassScheduleResponseDto>>> GetByInstructorIdAsync(int instructorId)
        {
            var schedules = await _scheduleRepository.GetByInstructorIdAsync(instructorId);
            var response = schedules.Select(MapToDto).ToList();
            return Result<List<ClassScheduleResponseDto>>.Success(response);
        }

        public async Task<Result<ClassScheduleResponseDto>> CreateAsync(CreateClassScheduleRequestDto request, int instructorId)
        {
            // Class kontrolü ve instructor yetkisi
            var classEntity = await _classRepository.GetByIdAsync(request.ClassId);
            if (classEntity == null)
            {
                throw new NotFoundException("Class", request.ClassId);
            }

            if (classEntity.InstructorId != instructorId)
            {
                return Result<ClassScheduleResponseDto>.Failure("You don't have permission to create schedule for this class");
            }

            // Çakışma kontrolü
            var hasConflict = await _scheduleRepository.HasScheduleConflictAsync(
                request.ClassId,
                request.DayOfWeek,
                request.StartTime,
                request.EndTime,
                request.RoomNumber);

            if (hasConflict)
            {
                return Result<ClassScheduleResponseDto>.Failure("Schedule conflict detected. Another class is scheduled at the same time and room.");
            }

            // Zaman kontrolü
            if (request.EndTime <= request.StartTime)
            {
                return Result<ClassScheduleResponseDto>.Failure("End time must be after start time");
            }

            var schedule = new ClassSchedule
            {
                ClassId = request.ClassId,
                DayOfWeek = request.DayOfWeek,
                StartTime = request.StartTime,
                EndTime = request.EndTime,
                RoomNumber = request.RoomNumber,
                Building = request.Building,
                Notes = request.Notes,
                IsActive = request.IsActive,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _scheduleRepository.AddAsync(schedule);
            await _scheduleRepository.SaveChangesAsync();

            var response = MapToDto(schedule);
            return Result<ClassScheduleResponseDto>.Success(response, "Schedule created successfully");
        }

        public async Task<Result<ClassScheduleResponseDto>> UpdateAsync(int id, UpdateClassScheduleRequestDto request, int instructorId)
        {
            var schedule = await _scheduleRepository.GetByIdAsync(id);
            if (schedule == null)
            {
                throw new NotFoundException("ClassSchedule", id);
            }

            // Instructor yetkisi kontrolü
            if (schedule.Class.InstructorId != instructorId)
            {
                return Result<ClassScheduleResponseDto>.Failure("You don't have permission to update this schedule");
            }

            // Çakışma kontrolü (kendisi hariç)
            var hasConflict = await _scheduleRepository.HasScheduleConflictAsync(
                schedule.ClassId,
                request.DayOfWeek,
                request.StartTime,
                request.EndTime,
                request.RoomNumber);

            if (hasConflict)
            {
                return Result<ClassScheduleResponseDto>.Failure("Schedule conflict detected. Another class is scheduled at the same time and room.");
            }

            // Zaman kontrolü
            if (request.EndTime <= request.StartTime)
            {
                return Result<ClassScheduleResponseDto>.Failure("End time must be after start time");
            }

            schedule.DayOfWeek = request.DayOfWeek;
            schedule.StartTime = request.StartTime;
            schedule.EndTime = request.EndTime;
            schedule.RoomNumber = request.RoomNumber;
            schedule.Building = request.Building;
            schedule.Notes = request.Notes;
            schedule.IsActive = request.IsActive;
            schedule.UpdatedAt = DateTime.UtcNow;

            await _scheduleRepository.UpdateAsync(schedule);
            await _scheduleRepository.SaveChangesAsync();

            var response = MapToDto(schedule);
            return Result<ClassScheduleResponseDto>.Success(response, "Schedule updated successfully");
        }

        public async Task<Result> DeleteAsync(int id, int instructorId)
        {
            var schedule = await _scheduleRepository.GetByIdAsync(id);
            if (schedule == null)
            {
                throw new NotFoundException("ClassSchedule", id);
            }

            // Instructor yetkisi kontrolü
            if (schedule.Class.InstructorId != instructorId)
            {
                return Result.Failure("You don't have permission to delete this schedule");
            }

            await _scheduleRepository.DeleteAsync(schedule);
            await _scheduleRepository.SaveChangesAsync();

            return Result.Success("Schedule deleted successfully");
        }

        public async Task<Result<List<ClassScheduleResponseDto>>> GetWeeklyScheduleAsync(int classId)
        {
            var schedules = await _scheduleRepository.GetWeeklyScheduleAsync(classId);
            var response = schedules.Select(MapToDto).ToList();
            return Result<List<ClassScheduleResponseDto>>.Success(response);
        }

        private ClassScheduleResponseDto MapToDto(ClassSchedule schedule)
        {
            return new ClassScheduleResponseDto
            {
                Id = schedule.Id,
                ClassId = schedule.ClassId,
                ClassName = schedule.Class?.ClassName ?? string.Empty,
                ClassCode = schedule.Class?.ClassCode ?? string.Empty,
                DayOfWeek = schedule.DayOfWeek,
                StartTime = schedule.StartTime,
                EndTime = schedule.EndTime,
                RoomNumber = schedule.RoomNumber,
                Building = schedule.Building,
                Notes = schedule.Notes,
                IsActive = schedule.IsActive,
                CreatedAt = schedule.CreatedAt,
                UpdatedAt = schedule.UpdatedAt ?? schedule.CreatedAt
            };
        }
    }
}
