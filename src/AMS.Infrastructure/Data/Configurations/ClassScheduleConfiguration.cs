using AMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AMS.Infrastructure.Data.Configurations;

public class ClassScheduleConfiguration : IEntityTypeConfiguration<ClassSchedule>
{
    public void Configure(EntityTypeBuilder<ClassSchedule> builder)
    {
        builder.ToTable("ClassSchedules");

        builder.HasKey(cs => cs.Id);

        builder.Property(cs => cs.DayOfWeek)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(cs => cs.StartTime)
            .IsRequired()
            .HasColumnType("time");

        builder.Property(cs => cs.EndTime)
            .IsRequired()
            .HasColumnType("time");

        builder.Property(cs => cs.RoomNumber)
            .HasMaxLength(100);

        builder.Property(cs => cs.Building)
            .HasMaxLength(200);

        builder.Property(cs => cs.Notes)
            .HasMaxLength(500);

        builder.Property(cs => cs.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(cs => cs.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(cs => cs.IsDeleted)
            .IsRequired()
            .HasDefaultValue(false);

        builder.HasOne(cs => cs.Class)
            .WithMany(c => c.Schedules)
            .HasForeignKey(cs => cs.ClassId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
