using AMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

public class AssignmentGroupConfiguration : IEntityTypeConfiguration<AssignmentGroup>
{
    public void Configure(EntityTypeBuilder<AssignmentGroup> builder)
    {
        builder.ToTable("AssignmentGroups");

        builder.HasKey(ag => ag.Id);

        builder.Property(ag => ag.GroupName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(ag => ag.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(ag => ag.IsDeleted)
            .IsRequired()
            .HasDefaultValue(false);

        builder.HasOne(ag => ag.Assignment)
            .WithMany(a => a.AssignmentGroups)
            .HasForeignKey(ag => ag.AssignmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(ag => ag.Members)
            .WithOne(gm => gm.Group)
            .HasForeignKey(gm => gm.GroupId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}