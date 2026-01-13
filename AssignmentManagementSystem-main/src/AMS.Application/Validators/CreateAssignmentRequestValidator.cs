using AMS.Application.DTOs.Assignment;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.Validators
{
    public  class CreateAssignmentRequestValidator:AbstractValidator<CreateAssignmentRequestDto>
    {
        public CreateAssignmentRequestValidator()
        {
            RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Assignment title is required")
            .MaximumLength(200).WithMessage("Title cannot exceed 200 characters");

            RuleFor(x => x.Description)
                .NotEmpty().WithMessage("Description is required")
                .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters");

            RuleFor(x => x.ClassId)
                .GreaterThan(0).WithMessage("Invalid class ID");

            RuleFor(x => x.Type)
                .IsInEnum().WithMessage("Invalid assignment type");

            RuleFor(x => x.DueDate)
                .GreaterThan(DateTime.UtcNow).WithMessage("Due date must be in the future");

            RuleFor(x => x.MaxScore)
                .GreaterThan(0).WithMessage("Max score must be greater than 0")
                .LessThanOrEqualTo(1000).WithMessage("Max score cannot exceed 1000");
        }
    }
}
