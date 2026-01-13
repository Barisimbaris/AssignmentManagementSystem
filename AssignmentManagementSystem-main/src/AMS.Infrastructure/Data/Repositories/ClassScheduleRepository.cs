using AMS.Domain.Entities;
using AMS.Domain.Interfaces;
using AMS.Infrastructure.Data.Context;
using Microsoft.EntityFrameworkCore;

namespace AMS.Infrastructure.Data.Repositories
{
    public class ClassScheduleRepository : IClassScheduleRepository
    {
        private readonly AMSDbContext _context;

        public ClassScheduleRepository(AMSDbContext context)
        {
            _context = context;
        }

        public async Task<ClassSchedule> AddAsync(ClassSchedule entity)
        {
            await _context.ClassSchedules.AddAsync(entity);
            return entity;
        }

        public Task UpdateAsync(ClassSchedule entity)
        {
            _context.ClassSchedules.Update(entity);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(ClassSchedule entity)
        {
            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;
            return Task.CompletedTask;
        }

        public async Task<ClassSchedule?> GetByIdAsync(int id)
        {
            return await _context.ClassSchedules
                .Include(s => s.Class)
                .ThenInclude(c => c.Course)
                .Include(s => s.Class)
                .ThenInclude(c => c.Instructor)
                .FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task<List<ClassSchedule>> GetAllAsync()
        {
            return await _context.ClassSchedules
                .Include(s => s.Class)
                .ThenInclude(c => c.Course)
                .Include(s => s.Class)
                .ThenInclude(c => c.Instructor)
                .Where(s => s.IsActive)
                .OrderBy(s => s.DayOfWeek)
                .ThenBy(s => s.StartTime)
                .ToListAsync();
        }

        public async Task<List<ClassSchedule>> GetByClassIdAsync(int classId)
        {
            return await _context.ClassSchedules
                .Include(s => s.Class)
                .Where(s => s.ClassId == classId && s.IsActive)
                .OrderBy(s => s.DayOfWeek)
                .ThenBy(s => s.StartTime)
                .ToListAsync();
        }

        public async Task<List<ClassSchedule>> GetByDayOfWeekAsync(DayOfWeek dayOfWeek)
        {
            return await _context.ClassSchedules
                .Include(s => s.Class)
                .ThenInclude(c => c.Course)
                .Include(s => s.Class)
                .ThenInclude(c => c.Instructor)
                .Where(s => s.DayOfWeek == dayOfWeek && s.IsActive)
                .OrderBy(s => s.StartTime)
                .ToListAsync();
        }

        public async Task<List<ClassSchedule>> GetByInstructorIdAsync(int instructorId)
        {
            return await _context.ClassSchedules
                .Include(s => s.Class)
                .ThenInclude(c => c.Course)
                .Where(s => s.Class.InstructorId == instructorId && s.IsActive)
                .OrderBy(s => s.DayOfWeek)
                .ThenBy(s => s.StartTime)
                .ToListAsync();
        }

        public async Task<List<ClassSchedule>> GetByRoomAsync(string roomNumber, string? building = null)
        {
            var query = _context.ClassSchedules
                .Include(s => s.Class)
                .ThenInclude(c => c.Course)
                .Where(s => s.RoomNumber == roomNumber && s.IsActive);

            if (!string.IsNullOrEmpty(building))
            {
                query = query.Where(s => s.Building == building);
            }

            return await query
                .OrderBy(s => s.DayOfWeek)
                .ThenBy(s => s.StartTime)
                .ToListAsync();
        }

        public async Task<List<ClassSchedule>> GetScheduleConflictsAsync(DayOfWeek dayOfWeek, TimeSpan startTime, TimeSpan endTime, string? roomNumber = null)
        {
            var query = _context.ClassSchedules
                .Include(s => s.Class)
                .ThenInclude(c => c.Course)
                .Where(s => s.DayOfWeek == dayOfWeek && s.IsActive)
                .Where(s => (s.StartTime < endTime && s.EndTime > startTime)); // Time overlap check

            if (!string.IsNullOrEmpty(roomNumber))
            {
                query = query.Where(s => s.RoomNumber == roomNumber);
            }

            return await query.ToListAsync();
        }

        public async Task<bool> HasScheduleConflictAsync(int classId, DayOfWeek dayOfWeek, TimeSpan startTime, TimeSpan endTime, string? roomNumber = null)
        {
            var query = _context.ClassSchedules
                .Where(s => s.ClassId != classId) // Exclude current class
                .Where(s => s.DayOfWeek == dayOfWeek && s.IsActive)
                .Where(s => (s.StartTime < endTime && s.EndTime > startTime)); // Time overlap check

            if (!string.IsNullOrEmpty(roomNumber))
            {
                query = query.Where(s => s.RoomNumber == roomNumber);
            }

            return await query.AnyAsync();
        }

        public async Task<List<ClassSchedule>> GetWeeklyScheduleAsync(int classId)
        {
            return await GetByClassIdAsync(classId);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}