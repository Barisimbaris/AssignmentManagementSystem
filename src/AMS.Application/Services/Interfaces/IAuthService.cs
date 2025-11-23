using AMS.Application.Common.Results;
using AMS.Application.DTOs.Auth;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.Services.Interfaces
{
    public interface IAuthService
    {
        Task<Result<LoginResponseDto>> LoginAsync(LoginRequestDto loginRequest);
        Task<Result<RegisterResponseDto>> RegisterAsync(RegisterRequestDto registerRequest);

        Task<Result> ChangePasswordAsync(int userId, string currentPassword, string newPassword);
        Task<Result<string>> GenerateJwtTokenAsync(int userId);
    }
}
