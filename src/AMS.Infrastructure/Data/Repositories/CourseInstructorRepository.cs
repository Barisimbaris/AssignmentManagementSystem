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
    public class CourseInstructorRepository : ICourseInstructorRepository
    {
        private readonly AMSDbContext _context;

        public CourseInstructorRepository(AMSDbContext context)
        {
            _context = context;
        }

        public async Task<CourseInstructor?> GetByIdAsync(int id)
        {
            return await _context.CourseInstructors
                .Include(ci => ci.Course)
                .Include(ci => ci.Instructor)
                .FirstOrDefaultAsync(ci => ci.Id == id && !ci.IsDeleted);
        }

        public async Task<CourseInstructor?> GetByCourseAndInstructorAsync(int courseId, int instructorId)
        {
            return await _context.CourseInstructors
                .Include(ci => ci.Course)
                .Include(ci => ci.Instructor)
                .FirstOrDefaultAsync(ci =>
                    ci.CourseId == courseId &&
                    ci.InstructorId == instructorId &&
                    ci.IsActive &&
                    !ci.IsDeleted);
        }

        public async Task<List<CourseInstructor>> GetByCourseIdAsync(int courseId)
        {
            return await _context.CourseInstructors
                .Include(ci => ci.Course)
                .Include(ci => ci.Instructor)
                .Where(ci => ci.CourseId == courseId && ci.IsActive && !ci.IsDeleted)
                .ToListAsync();
        }

        public async Task<List<CourseInstructor>> GetByInstructorIdAsync(int instructorId)
        {
            return await _context.CourseInstructors
                .Include(ci => ci.Course)
                .Include(ci => ci.Instructor)
                .Where(ci => ci.InstructorId == instructorId && ci.IsActive && !ci.IsDeleted)
                .ToListAsync();
        }

        public async Task<bool> IsAssignedAsync(int courseId, int instructorId)
        {
            return await _context.CourseInstructors
                .AnyAsync(ci =>
                    ci.CourseId == courseId &&
                    ci.InstructorId == instructorId &&
                    ci.IsActive &&
                    !ci.IsDeleted);
        }

        public async Task<CourseInstructor> AddAsync(CourseInstructor courseInstructor)
        {
            await _context.CourseInstructors.AddAsync(courseInstructor);
            return courseInstructor;
        }

        public Task DeleteAsync(CourseInstructor courseInstructor)
        {
            courseInstructor.IsDeleted = true;
            courseInstructor.IsActive = false;
            courseInstructor.UpdatedAt = DateTime.UtcNow;
            return Task.CompletedTask;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}