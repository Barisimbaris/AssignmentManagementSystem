using AMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Infrastructure.Data.Context
{
    public  class AMSDbContext : DbContext
    {
        public AMSDbContext(DbContextOptions<AMSDbContext> options) : base(options) { 
        
        }
        public DbSet<User> Users { get; set; }
        public DbSet<Course> Courses { get; set; }
        public DbSet<Class> Classes { get; set; }
        public DbSet<Enrollment> Enrollments { get; set; }
        public DbSet<Assignment> Assignments { get; set; }
        public DbSet<Submission> Submissions { get; set; }
        public DbSet<Grade> Grades { get; set; }
        public DbSet<AssignmentGroup> AssignmentGroups { get; set; }
        public DbSet<GroupMember> GroupMembers { get; set; }
        public DbSet<Notification> Notifications { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(AMSDbContext).Assembly);

            modelBuilder.Entity<User>().HasQueryFilter(u => !u.IsDeleted);
            modelBuilder.Entity<Course>().HasQueryFilter(c => !c.IsDeleted);
            modelBuilder.Entity<Class>().HasQueryFilter(c => !c.IsDeleted);
            modelBuilder.Entity<Assignment>().HasQueryFilter(a => !a.IsDeleted);
            modelBuilder.Entity<Submission>().HasQueryFilter(s => !s.IsDeleted);
            modelBuilder.Entity<Grade>().HasQueryFilter(g => !g.IsDeleted);
            modelBuilder.Entity<Enrollment>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<AssignmentGroup>().HasQueryFilter(ag => !ag.IsDeleted);
            modelBuilder.Entity<GroupMember>().HasQueryFilter(gm => !gm.IsDeleted);
            modelBuilder.Entity<Notification>().HasQueryFilter(n => !n.IsDeleted);


        }
    }
    }

