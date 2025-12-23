using AMS.Application.Common.Exceptions;
using AMS.Application.Common.Results;
using AMS.Application.DTOs.User;
using AMS.Application.Services.Interfaces;
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
        private readonly IClassRepository _classRepository;            // ✅ EKLE
        private readonly IEnrollmentRepository _enrollmentRepository;

        public UserService(
            IUserRepository userRepository,
            IClassRepository classRepository,            // ✅ EKLE
            IEnrollmentRepository enrollmentRepository)  // ✅ EKLE
        {
            _userRepository = userRepository;
            _classRepository = classRepository;            // ✅ EKLE
            _enrollmentRepository = enrollmentRepository;  // ✅ EKLE
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
        public async Task<Result<List<UserResponseDto>>> GetStudentsByInstructorIdAsync(int instructorId)
        {
            // Instructor'ın class'larını bul
            var classes = await _classRepository.GetByInstructorIdAsync(instructorId);
            var classIds = classes.Select(c => c.Id).ToList();

            // Bu class'lara kayıtlı öğrencileri bul
            var enrollments = await _enrollmentRepository.GetByClassIdsAsync(classIds);
            var studentIds = enrollments.Select(e => e.StudentId).Distinct().ToList();

            var students = await _userRepository.GetByIdsAsync(studentIds);

            var response = students.Select(u => new UserResponseDto
            {
                Id = u.Id,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Email = u.Email,
                Role = u.Role.ToString(),
                Department = u.Department,
                StudentNumber = u.StudentNumber
            }).ToList();

            return Result<List<UserResponseDto>>.Success(response);
        }
    }

}
