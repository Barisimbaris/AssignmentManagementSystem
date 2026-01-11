using AMS.Application.Common.Exceptions;
using System.Net;
using System.Text.Json;

namespace AMS.API.Middlewares
{
    public class GlobalExceptionHandlerMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;
        private readonly IWebHostEnvironment _environment;

        public GlobalExceptionHandlerMiddleware(
            RequestDelegate next,
            ILogger<GlobalExceptionHandlerMiddleware> logger,
            IWebHostEnvironment environment)
        {
            _next = next;
            _logger = logger;
            _environment = environment;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unhandled exception occurred");
                await HandleExceptionAsync(context, ex);
            }
        }

        private Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            var statusCode = HttpStatusCode.InternalServerError;
            var message = "An error occurred while processing your request";
            var errors = new List<string>();

            switch (exception)
            {
                case NotFoundException notFoundException:
                    statusCode = HttpStatusCode.NotFound;
                    message = notFoundException.Message;
                    break;

                case ValidationException validationException:
                    statusCode = HttpStatusCode.BadRequest;
                    message = "Validation failed";
                    errors = validationException.Errors;
                    break;

                case BusinessException businessException:
                    statusCode = HttpStatusCode.BadRequest;
                    message = businessException.Message;
                    break;

                case UnauthorizedException unauthorizedException:
                    statusCode = HttpStatusCode.Unauthorized;
                    message = unauthorizedException.Message;
                    break;

                default:
                    // Log the full exception for internal server errors
                    message = exception.Message;
                    if (exception.InnerException != null)
                    {
                        errors.Add(exception.InnerException.Message);
                    }
                    // Only include stack trace in development
                    if (_environment.IsDevelopment())
                    {
                        errors.Add(exception.StackTrace ?? "No stack trace available");
                    }
                    break;
            }

            var response = new
            {
                success = false,
                message,
                errors = errors.Any() ? errors : new List<string> { message },
                statusCode = (int)statusCode
            };

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)statusCode;

            var jsonResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            return context.Response.WriteAsync(jsonResponse);
        }
    }
}
