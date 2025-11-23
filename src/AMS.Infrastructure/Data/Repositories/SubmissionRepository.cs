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
    public class SubmissionRepository : ISubmissionRepository
    {
        private readonly AMSDbContext _context;

        public SubmissionRepository(AMSDbContext context)
        {
            _context = context;
        }

        public async Task<Submission?> GetByIdAsync(int id)
        {
            return await _context.Submissions
                .Include(s => s.Assignment)
                .Include(s => s.Student)
                .Include(s => s.Grade)
                .FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task<List<Submission>> GetByAssignmentIdAsync(int assignmentId)
        {
            return await _context.Submissions
                .Include(s => s.Student)
                .Include(s => s.Grade)
                .Where(s => s.AssignmentId == assignmentId)
                .OrderByDescending(s => s.SubmittedAt)
                .ToListAsync();
        }

        public async Task<List<Submission>> GetByStudentIdAsync(int studentId)
        {
            return await _context.Submissions
                .Include(s => s.Assignment)
                .ThenInclude(a => a.Class)
                .Include(s => s.Grade)
                .Where(s => s.StudentId == studentId)
                .OrderByDescending(s => s.SubmittedAt)
                .ToListAsync();
        }

        public async Task<Submission?> GetByAssignmentAndStudentAsync(int assignmentId, int studentId)
        {
            return await _context.Submissions
                .Include(s => s.Grade)
                .FirstOrDefaultAsync(s => s.AssignmentId == assignmentId && s.StudentId == studentId);
        }

        public async Task<Submission> AddAsync(Submission submission)
        {
            await _context.Submissions.AddAsync(submission);
            return submission;
        }

        public Task UpdateAsync(Submission submission)
        {
            _context.Submissions.Update(submission);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(Submission submission)
        {
            submission.IsDeleted = true;
            submission.UpdatedAt = DateTime.UtcNow;
            return Task.CompletedTask;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
