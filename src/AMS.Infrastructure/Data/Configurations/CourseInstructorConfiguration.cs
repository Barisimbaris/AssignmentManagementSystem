using AMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AMS.Infrastructure.Data.Configurations;

public class CourseInstructorConfiguration : IEntityTypeConfiguration<CourseInstructor>
{
    public void Configure(EntityTypeBuilder<CourseInstructor> builder)
    {
        builder.ToTable("CourseInstructors");

        builder.HasKey(ci => ci.Id);

        builder.Property(ci => ci.AcademicYear)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(ci => ci.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(ci => ci.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(ci => ci.IsDeleted)
            .IsRequired()
            .HasDefaultValue(false);

        builder.HasIndex(ci => new { ci.CourseId, ci.InstructorId, ci.AcademicYear })
            .IsUnique();

        builder.HasOne(ci => ci.Course)
            .WithMany()
            .HasForeignKey(ci => ci.CourseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ci => ci.Instructor)
            .WithMany()
            .HasForeignKey(ci => ci.InstructorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
