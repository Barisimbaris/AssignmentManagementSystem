using AMS.Domain.Entities;
using AMS.Domain.Interfaces;
using AMS.Infrastructure.Data.Context;
using Microsoft.EntityFrameworkCore;

namespace AMS.Infrastructure.Data.Repositories;

public class GradeRepository : IGradeRepository
{
    private readonly AMSDbContext _context;

    public GradeRepository(AMSDbContext context)
    {
        _context = context;
    }

    public async Task<Grade?> GetByIdAsync(int id)
    {
        return await _context.Grades
            .Include(g => g.Submission.Assignment)
            .Include(g => g.Submission.Student)
            .Include(g => g.Instructor)
            .FirstOrDefaultAsync(g => g.Id == id);
    }

    public async Task<Grade?> GetBySubmissionIdAsync(int submissionId)
    {
        return await _context.Grades
            .Include(g => g.Submission.Assignment)
            .Include(g => g.Submission.Student)
            .Include(g => g.Instructor)
            .FirstOrDefaultAsync(g => g.SubmissionId == submissionId);
    }

    public async Task<List<Grade>> GetByStudentIdAsync(int studentId)
    {
        return await _context.Grades
            .Include(g => g.Submission.Assignment)
            .Include(g => g.Submission.Student)
            .Include(g => g.Instructor)
            .Where(g => g.Submission.StudentId == studentId)
            .OrderByDescending(g => g.GradedAt)
            .ToListAsync();
    }

    public async Task<List<Grade>> GetByClassIdAsync(int classId)
    {
        return await _context.Grades
            .Include(g => g.Submission.Assignment)
            .Include(g => g.Submission.Student)
            .Include(g => g.Instructor)
            .Where(g => g.Submission.Assignment.ClassId == classId)
            .ToListAsync();
    }

    public async Task<List<Grade>> GetByIdsAsync(List<int> ids)
    {
        return await _context.Grades
            .Include(g => g.Submission.Assignment)
            .Include(g => g.Submission.Student)
            .Include(g => g.Instructor)
            .Where(g => ids.Contains(g.Id))
            .ToListAsync();
    }

    public async Task<Grade> AddAsync(Grade grade)
    {
        await _context.Grades.AddAsync(grade);
        return grade;
    }

    public Task UpdateAsync(Grade grade)
    {
        _context.Grades.Update(grade);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Grade grade)
    {
        grade.IsDeleted = true;
        grade.UpdatedAt = DateTime.UtcNow;
        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}