using AMS.Domain.Entities;
using AMS.Domain.Interfaces;
using AMS.Infrastructure.Data.Context;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Infrastructure.Data.Repositories
{
    public class ClassRepository : IClassRepository
    {
        private readonly AMSDbContext _context;

        public ClassRepository(AMSDbContext context)
        {
            _context = context;
        }

        public async Task<Class?> GetByIdAsync(int id)
        {
            return await _context.Classes
                .Include(c => c.Course)
                .Include(c => c.Instructor)
                .Include(c => c.Enrollments)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<List<Class>> GetAllAsync()
        {
            return await _context.Classes
                .Include(c => c.Course)
                .Include(c => c.Instructor)
                .ToListAsync();
        }

        public async Task<List<Class>> GetByCourseIdAsync(int courseId)
        {
            return await _context.Classes
                .Include(c => c.Instructor)
                .Where(c => c.CourseId == courseId)
                .ToListAsync();
        }

        public async Task<List<Class>> GetByInstructorIdAsync(int instructorId)
        {
            return await _context.Classes
        .Include(c => c.Course)
        .Include(c => c.Instructor)
        .Include(c => c.Enrollments)
        .Where(c => c.InstructorId == instructorId)
        .ToListAsync();
        }

        public async Task<Class> AddAsync(Class classEntity)
        {
            await _context.Classes.AddAsync(classEntity);
            return classEntity;
        }

        public Task UpdateAsync(Class classEntity)
        {
            _context.Classes.Update(classEntity);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(Class classEntity)
        {
            classEntity.IsDeleted = true;
            classEntity.UpdatedAt = DateTime.UtcNow;
            return Task.CompletedTask;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
