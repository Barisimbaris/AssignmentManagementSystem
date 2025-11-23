using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BaseController : ControllerBase
    {

        protected int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst("UserId")?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
            {
                throw new UnauthorizedAccessException("User ID not found in token");
            }

            return int.Parse(userIdClaim);
        }

        protected string GetCurrentUserEmail()
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;

            if (string.IsNullOrEmpty(email))
            {
                throw new UnauthorizedAccessException("Email not found in token");
            }

            return email;
        }

        protected string GetCurrentUserRole()
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(role))
            {
                throw new UnauthorizedAccessException("Role not found in token");
            }

            return role;
        }

        protected bool IsInRole(string role)
        {
            return User.IsInRole(role);
        }
    }
}
