using AMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

public class AssignmentConfiguration : IEntityTypeConfiguration<Assignment>
{
    public void Configure(EntityTypeBuilder<Assignment> builder)
    {
        builder.ToTable("Assignments");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(a => a.Description)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(a => a.Type)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(a => a.DueDate)
            .IsRequired();

        builder.Property(a => a.MaxScore)
            .IsRequired()
            .HasDefaultValue(100);

        builder.Property(a => a.AllowLateSubmission)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(a => a.AllowResubmission)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(a => a.AttachmentPath)
            .HasMaxLength(500);

        builder.Property(a => a.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(a => a.IsDeleted)
            .IsRequired()
            .HasDefaultValue(false);

        builder.HasOne(a => a.Class)
            .WithMany(c => c.Assignments)
            .HasForeignKey(a => a.ClassId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(a => a.Submissions)
            .WithOne(s => s.Assignment)
            .HasForeignKey(s => s.AssignmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(a => a.AssignmentGroups)
            .WithOne(ag => ag.Assignment)
            .HasForeignKey(ag => ag.AssignmentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}