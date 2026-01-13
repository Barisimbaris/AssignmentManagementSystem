using AMS.Application.DTOs.Auth;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.Validators
{
    public  class LoginRequestValidator : AbstractValidator<LoginRequestDto>
    {

        public LoginRequestValidator()
        {
            RuleFor(x => x.Email)
                    .NotEmpty().WithMessage("Email is required")
                    .EmailAddress().WithMessage("Invalid email format");
            RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required");
        }
    }
}
