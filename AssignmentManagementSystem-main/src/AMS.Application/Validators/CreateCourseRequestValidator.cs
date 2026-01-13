using AMS.Application.DTOs.Course;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.Validators
{
    public class CreateCourseRequestValidator: AbstractValidator<CreateCourseRequestDto>
    {

        public CreateCourseRequestValidator()
        {
            RuleFor(x => x.CourseCode)
            .NotEmpty().WithMessage("Course code is required")
            .MaximumLength(20).WithMessage("Course code cannot exceed 20 characters");

            RuleFor(x => x.CourseName)
                .NotEmpty().WithMessage("Course name is required")
                .MaximumLength(200).WithMessage("Course name cannot exceed 200 characters");

            RuleFor(x => x.Description)
                .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters")
                .When(x => !string.IsNullOrEmpty(x.Description));

            RuleFor(x => x.Department)
                .NotEmpty().WithMessage("Department is required")
                .MaximumLength(100).WithMessage("Department cannot exceed 100 characters");

            RuleFor(x => x.CreditHours)
                .GreaterThan(0).WithMessage("Credit hours must be greater than 0")
                .LessThanOrEqualTo(10).WithMessage("Credit hours cannot exceed 10");

            RuleFor(x => x.AcademicYear)
                .NotEmpty().WithMessage("Academic year is required")
                .MaximumLength(20).WithMessage("Academic year cannot exceed 20 characters")
                .Matches(@"^\d{4}-\d{4}$").WithMessage("Academic year must be in format YYYY-YYYY (e.g., 2024-2025)");
        }
    }
}
