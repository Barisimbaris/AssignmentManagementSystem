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
    public class CourseRepository : ICourseRepository
    {
        private readonly AMSDbContext _context;

        public CourseRepository(AMSDbContext context)
        {
            _context = context;
        }

        public async Task<Course?> GetByIdAsync(int id)
        {
            return await _context.Courses
                .Include(c => c.Classes)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<Course?> GetByCourseCodeAsync(string courseCode)
        {
            return await _context.Courses
                .FirstOrDefaultAsync(c => c.CourseCode == courseCode);
        }

        public async Task<List<Course>> GetAllAsync()
        {
            return await _context.Courses.ToListAsync();
        }

        public async Task<List<Course>> GetByDepartmentAsync(string department)
        {
            return await _context.Courses
                .Where(c => c.Department == department)
                .ToListAsync();
        }

        public async Task<Course> AddAsync(Course course)
        {
            await _context.Courses.AddAsync(course);
            return course;
        }

        public Task UpdateAsync(Course course)
        {
            _context.Courses.Update(course);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(Course course)
        {
            course.IsDeleted = true;
            course.UpdatedAt = DateTime.UtcNow;
            return Task.CompletedTask;
        }

        public async Task<bool> CourseCodeExistsAsync(string courseCode)
        {
            return await _context.Courses
                .AnyAsync(c => c.CourseCode == courseCode);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
