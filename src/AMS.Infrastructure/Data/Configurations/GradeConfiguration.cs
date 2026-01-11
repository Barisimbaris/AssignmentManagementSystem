using AMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AMS.Infrastructure.Data.Configurations;

public class GradeConfiguration : IEntityTypeConfiguration<Grade>
{
    public void Configure(EntityTypeBuilder<Grade> builder)
    {
        builder.ToTable("Grades");

        builder.HasKey(g => g.Id);

        builder.Property(g => g.Score)
            .IsRequired()
            .HasColumnType("decimal(18,2)");

        builder.Property(g => g.Feedback)
            .HasMaxLength(2000);

        builder.Property(g => g.GradedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(g => g.IsPublished)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(g => g.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(g => g.IsDeleted)
            .IsRequired()
            .HasDefaultValue(false);

        builder.HasIndex(g => g.SubmissionId)
            .IsUnique();

        builder.HasIndex(g => g.InstructorId);

        builder.HasOne(g => g.Submission)
            .WithOne(s => s.Grade)
            .HasForeignKey<Grade>(g => g.SubmissionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(g => g.Instructor)
            .WithMany()
            .HasForeignKey(g => g.InstructorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
