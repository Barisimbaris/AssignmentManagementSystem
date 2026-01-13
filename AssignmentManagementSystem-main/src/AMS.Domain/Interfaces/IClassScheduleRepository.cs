using AMS.Domain.Entities;
using AMS.Domain.Common.Interfaces;

namespace AMS.Domain.Interfaces
{
    public interface IClassScheduleRepository : IRepository<ClassSchedule>
    {
        Task<List<ClassSchedule>> GetByClassIdAsync(int classId);
        Task<List<ClassSchedule>> GetByDayOfWeekAsync(DayOfWeek dayOfWeek);
        Task<List<ClassSchedule>> GetByInstructorIdAsync(int instructorId);
        Task<List<ClassSchedule>> GetByRoomAsync(string roomNumber, string? building = null);
        Task<List<ClassSchedule>> GetScheduleConflictsAsync(DayOfWeek dayOfWeek, TimeSpan startTime, TimeSpan endTime, string? roomNumber = null);
        Task<bool> HasScheduleConflictAsync(int classId, DayOfWeek dayOfWeek, TimeSpan startTime, TimeSpan endTime, string? roomNumber = null);
        Task<List<ClassSchedule>> GetWeeklyScheduleAsync(int classId);
    }
}