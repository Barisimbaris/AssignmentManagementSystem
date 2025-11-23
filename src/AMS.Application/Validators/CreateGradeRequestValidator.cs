using AMS.Application.DTOs.Grade;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.Validators
{
    public class CreateGradeRequestValidator : AbstractValidator<CreateGradeRequestDto>
    {
        public CreateGradeRequestValidator()
        {
            RuleFor(x => x.SubmissionId)
            .GreaterThan(0).WithMessage("Invalid submission ID");

            RuleFor(x => x.Score)
                .GreaterThanOrEqualTo(0).WithMessage("Score cannot be negative")
                .LessThanOrEqualTo(100).WithMessage("Score cannot exceed 100");

            RuleFor(x => x.Feedback)
                .MaximumLength(2000).WithMessage("Feedback cannot exceed 2000 characters")
                .When(x => !string.IsNullOrEmpty(x.Feedback));
        }
    }
}
