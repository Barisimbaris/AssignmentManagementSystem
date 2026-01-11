using AMS.Application.Common.Exceptions;
using AMS.Application.Common.Results;
using AMS.Application.DTOs.User;
using AMS.Application.Services.Interfaces;
using AMS.Domain.Entities;  
using AMS.Domain.Enums;
using AMS.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.Services.Implementations
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly IClassRepository _classRepository;            
        private readonly IEnrollmentRepository _enrollmentRepository;

        public UserService(
            IUserRepository userRepository,
            IClassRepository classRepository,           
            IEnrollmentRepository enrollmentRepository) 
        {
            _userRepository = userRepository;
            _classRepository = classRepository;           
            _enrollmentRepository = enrollmentRepository; 
        }

        public async Task<Result<UserResponseDto>> GetByIdAsync(int id)
        {
            var user = await _userRepository.GetByIdAsync(id);

            if (user == null)
            {
                throw new NotFoundException("User", id);
            }

            var response = new UserResponseDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Role = user.Role.ToString(),
                StudentNumber = user.StudentNumber,
                Department = user.Department,
                PhoneNumber = user.PhoneNumber,
                CreatedAt = user.CreatedAt
            };

            return Result<UserResponseDto>.Success(response);
        }

        public async Task<Result<UserResponseDto>> GetByEmailAsync(string email)
        {
            var user = await _userRepository.GetByEmailAsync(email);

            if (user == null)
            {
                throw new NotFoundException($"User with email {email} not found");
            }

            var response = new UserResponseDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Role = user.Role.ToString(),
                StudentNumber = user.StudentNumber,
                Department = user.Department,
                PhoneNumber = user.PhoneNumber,
                CreatedAt = user.CreatedAt
            };

            return Result<UserResponseDto>.Success(response);
        }

        public async Task<Result<List<UserResponseDto>>> GetAllAsync()
        {
            var users = await _userRepository.GetAllAsync();

            var response = users.Select(u => new UserResponseDto
            {
                Id = u.Id,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Email = u.Email,
                Role = u.Role.ToString(),
                StudentNumber = u.StudentNumber,
                Department = u.Department,
                PhoneNumber = u.PhoneNumber,
                CreatedAt = u.CreatedAt
            }).ToList();

            return Result<List<UserResponseDto>>.Success(response);
        }

        public async Task<Result<List<UserResponseDto>>> GetStudentsAsync()
        {
            var students = await _userRepository.GetByRoleAsync(UserRole.Student);

            var response = students.Select(s => new UserResponseDto
            {
                Id = s.Id,
                FirstName = s.FirstName,
                LastName = s.LastName,
                Email = s.Email,
                Role = s.Role.ToString(),
                StudentNumber = s.StudentNumber,
                Department = s.Department,
                PhoneNumber = s.PhoneNumber,
                CreatedAt = s.CreatedAt
            }).ToList();

            return Result<List<UserResponseDto>>.Success(response);
        }

        public async Task<Result<List<UserResponseDto>>> GetInstructorsAsync()
        {
            var instructors = await _userRepository.GetByRoleAsync(UserRole.Instructor);

            var response = instructors.Select(i => new UserResponseDto
            {
                Id = i.Id,
                FirstName = i.FirstName,
                LastName = i.LastName,
                Email = i.Email,
                Role = i.Role.ToString(),
                StudentNumber = i.StudentNumber,
                Department = i.Department,
                PhoneNumber = i.PhoneNumber,
                CreatedAt = i.CreatedAt
            }).ToList();

            return Result<List<UserResponseDto>>.Success(response);
        }

        public async Task<Result<List<InstructorStudentsResponseDto>>> GetInstructorStudentsAsync(int instructorId)
        {
            // Instructor'ın class'larını al
            var classes = await _classRepository.GetByInstructorIdAsync(instructorId);

            var response = new List<InstructorStudentsResponseDto>();

            foreach (var classEntity in classes)
            {
                // Class'a kayıtlı öğrencileri al
                var enrollments = await _enrollmentRepository.GetByClassIdAsync(classEntity.Id);
                var students = enrollments
                    .Where(e => e.Student.Role == UserRole.Student)
                    .Select(e => new UserResponseDto
                    {
                        Id = e.Student.Id,
                        FirstName = e.Student.FirstName,
                        LastName = e.Student.LastName,
                        Email = e.Student.Email,
                        Role = e.Student.Role.ToString(),
                        StudentNumber = e.Student.StudentNumber,
                        Department = e.Student.Department,
                        PhoneNumber = e.Student.PhoneNumber,
                        CreatedAt = e.Student.CreatedAt
                    })
                    .OrderBy(s => s.StudentNumber)
                    .ToList();

                response.Add(new InstructorStudentsResponseDto
                {
                    ClassId = classEntity.Id,
                    ClassName = classEntity.ClassName,
                    ClassCode = classEntity.ClassCode ?? string.Empty,
                    CourseName = classEntity.Course?.CourseName ?? string.Empty,
                    CourseCode = classEntity.Course?.CourseCode ?? string.Empty,
                    StudentCount = students.Count,
                    Students = students
                });
            }

            return Result<List<InstructorStudentsResponseDto>>.Success(response);
        }

        public async Task<Result<UserResponseDto>> UpdateAsync(int id, UpdateUserRequestDto request)
        {
            var user = await _userRepository.GetByIdAsync(id);

            if (user == null)
            {
                throw new NotFoundException("User", id);
            }

            if (!string.IsNullOrEmpty(request.FirstName))
                user.FirstName = request.FirstName;

            if (!string.IsNullOrEmpty(request.LastName))
                user.LastName = request.LastName;

            if (!string.IsNullOrEmpty(request.PhoneNumber))
                user.PhoneNumber = request.PhoneNumber;

            if (!string.IsNullOrEmpty(request.Department))
                user.Department = request.Department;

            user.UpdatedAt = DateTime.UtcNow;

            await _userRepository.UpdateAsync(user);
            await _userRepository.SaveChangesAsync();

            var response = new UserResponseDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Role = user.Role.ToString(),
                StudentNumber = user.StudentNumber,
                Department = user.Department,
                PhoneNumber = user.PhoneNumber,
                CreatedAt = user.CreatedAt
            };

            return Result<UserResponseDto>.Success(response, "User updated successfully");
        }

        // ✅ Missing method implementation
        public async Task<Result> ChangePasswordAsync(int userId, ChangePasswordRequestDto request)
        {
            var user = await _userRepository.GetByIdAsync(userId);

            if (user == null)
            {
                throw new NotFoundException("User", userId);
            }

            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            {
                return Result.Failure("Current password is incorrect");
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            await _userRepository.UpdateAsync(user);
            await _userRepository.SaveChangesAsync();

            return Result.Success("Password changed successfully");
        }

        public async Task<Result> DeleteAsync(int id)
        {
            var user = await _userRepository.GetByIdAsync(id);

            if (user == null)
            {
                throw new NotFoundException("User", id);
            }

            await _userRepository.DeleteAsync(user);
            await _userRepository.SaveChangesAsync();

            return Result.Success("User deleted successfully");
        }

        // ✅ BULK IMPORT FUNCTIONALITY
        public async Task<Result<BulkImportResultDto>> BulkImportAsync(BulkImportRequestDto request)
        {
            var result = new BulkImportResultDto
            {
                TotalUsers = request.Users.Count
            };

            var createdUserIds = new List<int>();
            var errors = new List<BulkImportErrorDto>();

            for (int i = 0; i < request.Users.Count; i++)
            {
                var userData = request.Users[i];
                var rowNumber = i + 2; // +2 because CSV starts from row 2 (after header)

                try
                {
                    // Email duplicate kontrolü (manual check)
                    var existingUser = await _userRepository.GetByEmailAsync(userData.Email);
                    if (existingUser != null)
                    {
                        if (request.SkipDuplicateEmails)
                        {
                            errors.Add(new BulkImportErrorDto
                            {
                                RowNumber = rowNumber,
                                Email = userData.Email,
                                ErrorMessage = "Email already exists - skipped"
                            });
                            continue;
                        }
                        else
                        {
                            errors.Add(new BulkImportErrorDto
                            {
                                RowNumber = rowNumber,
                                Email = userData.Email,
                                ErrorMessage = "Email already exists"
                            });
                            result.FailedImports++;
                            continue;
                        }
                    }

                    // User oluştur
                    var user = new User
                    {
                        FirstName = userData.FirstName.Trim(),
                        LastName = userData.LastName.Trim(),
                        Email = userData.Email.Trim().ToLowerInvariant(),
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(userData.Password),
                        Role = userData.Role,
                        StudentNumber = userData.StudentNumber?.Trim(),
                        Department = userData.Department?.Trim(),
                        PhoneNumber = userData.PhoneNumber?.Trim(),
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    await _userRepository.AddAsync(user);
                    await _userRepository.SaveChangesAsync();

                    createdUserIds.Add(user.Id);
                    result.SuccessfulImports++;

                    // Welcome email atlandı (isteğe bağlı)
                    if (request.SendWelcomeEmails)
                    {
                        try
                        {
                            // Notification service gelecekte eklenebilir
                            Console.WriteLine($"Welcome email would be sent to {userData.Email}");
                        }
                        catch (Exception emailEx)
                        {
                            Console.WriteLine($"Welcome email failed for {userData.Email}: {emailEx.Message}");
                        }
                    }
                }
                catch (Exception ex)
                {
                    errors.Add(new BulkImportErrorDto
                    {
                        RowNumber = rowNumber,
                        Email = userData.Email,
                        ErrorMessage = ex.Message
                    });
                    result.FailedImports++;
                }
            }

            result.Errors = errors;
            result.CreatedUserIds = createdUserIds;

            var message = $"Bulk import completed: {result.SuccessfulImports} successful, {result.FailedImports} failed";
            return Result<BulkImportResultDto>.Success(result, message);
        }
    }
}
