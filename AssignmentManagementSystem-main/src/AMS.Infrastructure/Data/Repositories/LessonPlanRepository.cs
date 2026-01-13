using AMS.Domain.Entities;
using AMS.Domain.Interfaces;
using AMS.Infrastructure.Data.Context;
using Microsoft.EntityFrameworkCore;

namespace AMS.Infrastructure.Data.Repositories
{
    public class LessonPlanRepository : ILessonPlanRepository
    {
        private readonly AMSDbContext _context;

        public LessonPlanRepository(AMSDbContext context)
        {
            _context = context;
        }

        public async Task<LessonPlan> AddAsync(LessonPlan entity)
        {
            await _context.LessonPlans.AddAsync(entity);
            return entity;
        }

        public Task UpdateAsync(LessonPlan entity)
        {
            _context.LessonPlans.Update(entity);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(LessonPlan entity)
        {
            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;
            return Task.CompletedTask;
        }

        public async Task<LessonPlan?> GetByIdAsync(int id)
        {
            return await _context.LessonPlans
                .Include(lp => lp.Class)
                .ThenInclude(c => c.Course)
                .FirstOrDefaultAsync(lp => lp.Id == id && !lp.IsDeleted);
        }

        public async Task<List<LessonPlan>> GetAllAsync()
        {
            return await _context.LessonPlans
                .Include(lp => lp.Class)
                .ThenInclude(c => c.Course)
                .Where(lp => !lp.IsDeleted)
                .ToListAsync();
        }

        public async Task<List<LessonPlan>> GetByClassIdAsync(int classId)
        {
            return await _context.LessonPlans
                .Include(lp => lp.Class)
                .ThenInclude(c => c.Course)
                .Where(lp => lp.ClassId == classId && !lp.IsDeleted)
                .OrderBy(lp => lp.WeekNumber)
                .ThenBy(lp => lp.StartDate)
                .ToListAsync();
        }

        public async Task<List<LessonPlan>> GetByInstructorIdAsync(int instructorId)
        {
            return await _context.LessonPlans
                .Include(lp => lp.Class)
                .ThenInclude(c => c.Course)
                .Where(lp => lp.Class.InstructorId == instructorId && !lp.IsDeleted)
                .OrderBy(lp => lp.WeekNumber)
                .ThenBy(lp => lp.StartDate)
                .ToListAsync();
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}


