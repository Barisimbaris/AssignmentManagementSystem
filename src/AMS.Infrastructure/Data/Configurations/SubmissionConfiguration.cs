using AMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

public class SubmissionConfiguration : IEntityTypeConfiguration<Submission>
{
    public void Configure(EntityTypeBuilder<Submission> builder)
    {
        builder.ToTable("Submissions");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.FilePath)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(s => s.FileType)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(s => s.FileSizeInBytes)
            .IsRequired();

        builder.Property(s => s.SubmittedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(s => s.Status)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(s => s.IsLate)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(s => s.Comments)
            .HasMaxLength(1000);

        builder.Property(s => s.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(s => s.IsDeleted)
            .IsRequired()
            .HasDefaultValue(false);

        builder.HasOne(s => s.Assignment)
            .WithMany(a => a.Submissions)
            .HasForeignKey(s => s.AssignmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.Student)
            .WithMany(u => u.Submissions)
            .HasForeignKey(s => s.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.Group)
            .WithMany()
            .HasForeignKey(s => s.GroupId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(s => s.Grade)
            .WithOne(g => g.Submission)
            .HasForeignKey<Grade>(g => g.SubmissionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}