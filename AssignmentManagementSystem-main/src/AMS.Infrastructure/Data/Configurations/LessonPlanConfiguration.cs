using AMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AMS.Infrastructure.Data.Configurations
{
    public class LessonPlanConfiguration : IEntityTypeConfiguration<LessonPlan>
    {
        public void Configure(EntityTypeBuilder<LessonPlan> builder)
        {
            builder.ToTable("LessonPlans");

            builder.HasKey(lp => lp.Id);

            builder.Property(lp => lp.Topic)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(lp => lp.Description)
                .HasMaxLength(2000);

            builder.Property(lp => lp.WeekNumber)
                .IsRequired();

            builder.Property(lp => lp.StartDate)
                .IsRequired();

            builder.Property(lp => lp.EndDate)
                .IsRequired();

            builder.Property(lp => lp.CreatedAt)
                .IsRequired()
                .HasDefaultValueSql("GETUTCDATE()");

            builder.Property(lp => lp.UpdatedAt)
                .IsRequired(false);

            builder.Property(lp => lp.IsDeleted)
                .IsRequired();
                // HasDefaultValue removed to ensure EF Core always sends the value explicitly

            builder.HasOne(lp => lp.Class)
                .WithMany(c => c.LessonPlans)
                .HasForeignKey(lp => lp.ClassId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(lp => lp.ClassId);
            builder.HasIndex(lp => lp.WeekNumber);
        }
    }
}

