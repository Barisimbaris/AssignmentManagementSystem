using AMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

public class GroupMemberConfiguration : IEntityTypeConfiguration<GroupMember>
{
    public void Configure(EntityTypeBuilder<GroupMember> builder)
    {
        builder.ToTable("GroupMembers");

        builder.HasKey(gm => gm.Id);

        builder.Property(gm => gm.IsLeader)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(gm => gm.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(gm => gm.IsDeleted)
            .IsRequired()
            .HasDefaultValue(false);

        builder.HasIndex(gm => new { gm.GroupId, gm.StudentId })
            .IsUnique();

        builder.HasOne(gm => gm.Group)
            .WithMany(ag => ag.Members)
            .HasForeignKey(gm => gm.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(gm => gm.Student)
            .WithMany()
            .HasForeignKey(gm => gm.StudentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
