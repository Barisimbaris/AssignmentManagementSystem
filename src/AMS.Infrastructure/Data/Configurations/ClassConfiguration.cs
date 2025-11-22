using AMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

public class ClassConfiguration : IEntityTypeConfiguration<Class>
{
    public void Configure(EntityTypeBuilder<Class> builder)
    {
        builder.ToTable("Classes");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.ClassName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.ClassCode)
            .HasMaxLength(50);

        builder.Property(c => c.Semester)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(c => c.MaxCapacity)
            .IsRequired()
            .HasDefaultValue(50);

        builder.Property(c => c.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(c => c.IsDeleted)
            .IsRequired()
            .HasDefaultValue(false);

        builder.HasIndex(c => c.ClassCode);

        builder.HasOne(c => c.Course)
            .WithMany(co => co.Classes)
            .HasForeignKey(c => c.CourseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Instructor)
            .WithMany(u => u.TaughtClasses)
            .HasForeignKey(c => c.InstructorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(c => c.Enrollments)
            .WithOne(e => e.Class)
            .HasForeignKey(e => e.ClassId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(c => c.Assignments)
            .WithOne(a => a.Class)
            .HasForeignKey(a => a.ClassId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}