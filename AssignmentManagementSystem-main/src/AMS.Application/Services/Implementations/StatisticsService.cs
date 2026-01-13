using AMS.Application.Common.Results;
using AMS.Application.DTOs.Statistics;
using AMS.Application.Services.Interfaces;
using AMS.Domain.Interfaces;
using AMS.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.Services.Implementations
{
    public class StatisticsService : IStatisticsService
    {
        private readonly ICourseRepository _courseRepository;
        private readonly IClassRepository _classRepository;
        private readonly IUserRepository _userRepository;
        private readonly IAssignmentRepository _assignmentRepository;
        private readonly ISubmissionRepository _submissionRepository;
        private readonly IEnrollmentRepository _enrollmentRepository;
        private readonly IGradeRepository _gradeRepository;

        public StatisticsService(
            ICourseRepository courseRepository,
            IClassRepository classRepository,
            IUserRepository userRepository,
            IAssignmentRepository assignmentRepository,
            ISubmissionRepository submissionRepository,
            IEnrollmentRepository enrollmentRepository,
            IGradeRepository gradeRepository)
        {
            _courseRepository = courseRepository;
            _classRepository = classRepository;
            _userRepository = userRepository;
            _assignmentRepository = assignmentRepository;
            _submissionRepository = submissionRepository;
            _enrollmentRepository = enrollmentRepository;
            _gradeRepository = gradeRepository;
        }

        public async Task<Result<AdminDashboardDto>> GetAdminDashboardAsync()
        {
            var courses = await _courseRepository.GetAllAsync();
            var classes = await _classRepository.GetAllAsync();
            var instructors = await _userRepository.GetByRoleAsync(UserRole.Instructor);
            var students = await _userRepository.GetByRoleAsync(UserRole.Student);
            var assignments = await _assignmentRepository.GetAllAsync();
            var allSubmissions = new List<Domain.Entities.Submission>();
            
            // Get all submissions
            foreach (var assignment in assignments)
            {
                var submissions = await _submissionRepository.GetByAssignmentIdAsync(assignment.Id);
                allSubmissions.AddRange(submissions);
            }

            var courseStatistics = new List<CourseStatisticsDto>();
            foreach (var c in courses)
            {
                courseStatistics.Add(new CourseStatisticsDto
                {
                    CourseId = c.Id,
                    CourseCode = c.CourseCode,
                    CourseName = c.CourseName,
                    TotalClasses = c.Classes.Count,
                    TotalStudents = c.Classes.SelectMany(cl => cl.Enrollments).Count(),
                    TotalAssignments = c.Classes.SelectMany(cl => cl.Assignments).Count(),
                    TotalSubmissions = c.Classes.SelectMany(cl => cl.Assignments).SelectMany(a => a.Submissions).Count(),
                    AverageGrade = await CalculateAverageGradeForCourseAsync(c.Id)
                });
            }

            var departmentGroups = courses.GroupBy(c => c.Department);
            var departmentStatistics = new List<DepartmentStatisticsDto>();
            
            foreach (var group in departmentGroups)
            {
                departmentStatistics.Add(new DepartmentStatisticsDto
                {
                    Department = group.Key,
                    TotalCourses = group.Count(),
                    TotalClasses = group.SelectMany(c => c.Classes).Count(),
                    TotalStudents = group.SelectMany(c => c.Classes).SelectMany(cl => cl.Enrollments).Count(),
                    TotalInstructors = group.SelectMany(c => c.Classes).Select(cl => cl.InstructorId).Distinct().Count(),
                    AverageGrade = await CalculateAverageGradeForDepartmentAsync(group.Key)
                });
            }

            var recentActivities = await GetRecentActivitiesAsync();

            var dashboard = new AdminDashboardDto
            {
                TotalCourses = courses.Count,
                TotalClasses = classes.Count,
                TotalInstructors = instructors.Count,
                TotalStudents = students.Count,
                TotalAssignments = assignments.Count,
                TotalSubmissions = allSubmissions.Count,
                CourseStatistics = courseStatistics,
                DepartmentStatistics = departmentStatistics,
                RecentActivities = recentActivities
            };

            return Result<AdminDashboardDto>.Success(dashboard);
        }

        public async Task<Result<InstructorDashboardDto>> GetInstructorDashboardAsync(int instructorId)
        {
            var classes = await _classRepository.GetByInstructorIdAsync(instructorId);
            var classIds = classes.Select(c => c.Id).ToList();

            if (!classIds.Any())
            {
                return Result<InstructorDashboardDto>.Success(new InstructorDashboardDto());
            }

            var assignments = await _assignmentRepository.GetByClassIdsAsync(classIds);
            var enrollments = await _enrollmentRepository.GetByClassIdsAsync(classIds);
            
            // Get all submissions for instructor's assignments
            var submissions = new List<Domain.Entities.Submission>();
            foreach (var assignment in assignments)
            {
                var assignmentSubmissions = await _submissionRepository.GetByAssignmentIdAsync(assignment.Id);
                submissions.AddRange(assignmentSubmissions);
            }

            // Calculate pending grades
            var gradedSubmissionIds = (await _gradeRepository.GetAllAsync()).Select(g => g.SubmissionId).ToHashSet();
            var pendingGrades = submissions.Where(s => !gradedSubmissionIds.Contains(s.Id)).Count();

            var classStatistics = new List<ClassStatisticsDto>();
            foreach (var classEntity in classes)
            {
                var classAssignments = assignments.Where(a => a.ClassId == classEntity.Id).ToList();
                var enrollmentCount = await _enrollmentRepository.GetEnrollmentCountByClassIdAsync(classEntity.Id);

                // Her ödev için UNIQUE öğrenci submission sayısını hesapla
                // (Bir öğrenci aynı ödeve birden fazla kez submission yapabilir, ama sadece bir kez sayılmalı)
                var totalSubmissions = 0;
                var pendingSubmissions = 0;
                
                foreach (var assignment in classAssignments)
                {
                    // Her ödev için unique öğrenci sayısını bul (bir öğrenci birden fazla submission yapmış olabilir)
                    // ÖNEMLİ: Sadece gerçek submission'ları say (FilePath'i olan VE FileSizeInBytes > 0 olan, yani öğrenci tarafından dosya yüklenmiş olan)
                    // Otomatik 0 notları için oluşturulan submission'ları sayma (bunların FilePath'i boş veya FileSizeInBytes = 0)
                    var assignmentSubmissions = submissions
                        .Where(s => 
                            s.AssignmentId == assignment.Id && 
                            !string.IsNullOrWhiteSpace(s.FilePath) && // Dosya yolu var
                            s.FileSizeInBytes > 0 && // Dosya boyutu 0'dan büyük
                            s.Status == Domain.Enums.SubmissionStatus.Submitted // Status Submitted
                        )
                        .ToList();
                    
                    var uniqueStudentSubmissions = assignmentSubmissions
                        .Select(s => s.StudentId)
                        .Distinct()
                        .Count();
                    
                    totalSubmissions += uniqueStudentSubmissions;
                    // Bekleyen submission = Toplam öğrenci sayısı - Bu ödev için teslim eden UNIQUE öğrenci sayısı
                    pendingSubmissions += Math.Max(0, enrollmentCount - uniqueStudentSubmissions);
                }

                classStatistics.Add(new ClassStatisticsDto
                {
                    ClassId = classEntity.Id,
                    ClassName = classEntity.ClassName,
                    CourseCode = classEntity.Course?.CourseCode ?? string.Empty,
                    TotalStudents = enrollmentCount,
                    TotalAssignments = classAssignments.Count,
                    TotalSubmissions = totalSubmissions,
                    PendingSubmissions = pendingSubmissions,
                    AverageGrade = await CalculateAverageGradeForClassAsync(classEntity.Id)
                });
            }

            var recentSubmissions = submissions
                .OrderByDescending(s => s.CreatedAt)
                .Take(10)
                .Select(s => new RecentSubmissionDto
                {
                    SubmissionId = s.Id,
                    StudentName = $"{s.Student?.FirstName ?? ""} {s.Student?.LastName ?? ""}".Trim(),
                    StudentEmail = s.Student?.Email ?? string.Empty,
                    AssignmentTitle = s.Assignment?.Title ?? string.Empty,
                    ClassName = s.Assignment?.Class?.ClassName ?? string.Empty,
                    SubmittedAt = s.CreatedAt,
                    IsGraded = gradedSubmissionIds.Contains(s.Id),
                    TimeAgo = CalculateTimeAgo(s.CreatedAt)
                }).ToList();

            var upcomingDeadlines = assignments
                .Where(a => a.DueDate > DateTime.UtcNow)
                .OrderBy(a => a.DueDate)
                .Take(5)
                .Select(a =>
                {
                    var enrollmentCount = enrollments.Count(e => e.ClassId == a.ClassId);
                    var submissionCount = submissions.Count(s => s.AssignmentId == a.Id);
                    
                    return new UpcomingDeadlineDto
                    {
                        AssignmentId = a.Id,
                        Title = a.Title,
                        ClassName = a.Class?.ClassName ?? string.Empty,
                        DueDate = a.DueDate,
                        TotalStudents = enrollmentCount,
                        SubmissionCount = submissionCount,
                        PendingCount = enrollmentCount - submissionCount,
                        SubmissionRate = enrollmentCount > 0 ? (double)submissionCount / enrollmentCount * 100 : 0,
                        DaysUntilDue = (int)(a.DueDate - DateTime.UtcNow).TotalDays
                    };
                }).ToList();

            var dashboard = new InstructorDashboardDto
            {
                TotalClasses = classes.Count,
                TotalStudents = enrollments.Select(e => e.StudentId).Distinct().Count(),
                TotalAssignments = assignments.Count,
                PendingGrades = pendingGrades,
                ClassStatistics = classStatistics,
                RecentSubmissions = recentSubmissions,
                UpcomingDeadlines = upcomingDeadlines
            };

            return Result<InstructorDashboardDto>.Success(dashboard);
        }

        public async Task<Result<StudentDashboardDto>> GetStudentDashboardAsync(int studentId)
        {
            var enrollments = await _enrollmentRepository.GetByStudentIdAsync(studentId);
            var classIds = enrollments.Select(e => e.ClassId).ToList();

            if (!classIds.Any())
            {
                return Result<StudentDashboardDto>.Success(new StudentDashboardDto());
            }

            var assignments = await _assignmentRepository.GetByClassIdsAsync(classIds);
            var submissions = await _submissionRepository.GetByStudentIdAsync(studentId);
            var grades = await _gradeRepository.GetByStudentIdAsync(studentId);

            var completedAssignments = submissions.Count;
            var totalAssignments = assignments.Count;
            var pendingAssignments = totalAssignments - completedAssignments;

            var averageGrade = grades.Any() ? grades.Average(g => (double)g.Score / g.Submission.Assignment.MaxScore * 100) : 0;

            var classProgress = new List<ClassProgressDto>();
            foreach (var enrollment in enrollments)
            {
                var classAssignments = assignments.Where(a => a.ClassId == enrollment.ClassId).ToList();
                var classSubmissions = submissions.Where(s => classAssignments.Any(a => a.Id == s.AssignmentId)).ToList();
                var classGrades = grades.Where(g => classSubmissions.Any(s => s.Id == g.SubmissionId)).ToList();

                classProgress.Add(new ClassProgressDto
                {
                    ClassId = enrollment.ClassId,
                    ClassName = enrollment.Class.ClassName,
                    CourseCode = enrollment.Class.Course.CourseCode,
                    TotalAssignments = classAssignments.Count,
                    CompletedAssignments = classSubmissions.Count,
                    CompletionPercentage = classAssignments.Count > 0 
                        ? (double)classSubmissions.Count / classAssignments.Count * 100 
                        : 0,
                    AverageGrade = classGrades.Any() 
                        ? classGrades.Average(g => (double)g.Score / g.Submission.Assignment.MaxScore * 100) 
                        : 0
                });
            }

            var upcomingAssignments = assignments
                .Where(a => a.DueDate > DateTime.UtcNow && !submissions.Any(s => s.AssignmentId == a.Id))
                .OrderBy(a => a.DueDate)
                .Take(5)
                .Select(a => new UpcomingAssignmentDto
                {
                    AssignmentId = a.Id,
                    Title = a.Title,
                    ClassName = a.Class.ClassName,
                    CourseCode = a.Class.Course.CourseCode,
                    DueDate = a.DueDate,
                    MaxScore = a.MaxScore,
                    IsSubmitted = submissions.Any(s => s.AssignmentId == a.Id),
                    DaysUntilDue = (int)(a.DueDate - DateTime.UtcNow).TotalDays
                }).ToList();

            var recentGrades = grades
                .OrderByDescending(g => g.CreatedAt)
                .Take(5)
                .Select(g => new RecentGradeDto
                {
                    GradeId = g.Id,
                    AssignmentTitle = g.Submission.Assignment.Title,
                    ClassName = g.Submission.Assignment.Class.ClassName,
                    Score = (int)g.Score,
                    MaxScore = g.Submission.Assignment.MaxScore,
                    Percentage = (double)g.Score / g.Submission.Assignment.MaxScore * 100,
                    GradedAt = g.CreatedAt,
                    InstructorName = $"{g.Submission.Assignment.Class.Instructor.FirstName} {g.Submission.Assignment.Class.Instructor.LastName}",
                    TimeAgo = CalculateTimeAgo(g.CreatedAt)
                }).ToList();

            var dashboard = new StudentDashboardDto
            {
                EnrolledClasses = enrollments.Count,
                TotalAssignments = totalAssignments,
                CompletedAssignments = completedAssignments,
                PendingAssignments = pendingAssignments,
                AverageGrade = averageGrade,
                ClassProgress = classProgress,
                UpcomingAssignments = upcomingAssignments,
                RecentGrades = recentGrades
            };

            return Result<StudentDashboardDto>.Success(dashboard);
        }

        public async Task<Result<List<CourseStatisticsDto>>> GetCourseStatisticsAsync()
        {
            var courses = await _courseRepository.GetAllAsync();

            var statistics = new List<CourseStatisticsDto>();
            foreach (var course in courses)
            {
                statistics.Add(new CourseStatisticsDto
                {
                    CourseId = course.Id,
                    CourseCode = course.CourseCode,
                    CourseName = course.CourseName,
                    TotalClasses = course.Classes.Count,
                    TotalStudents = course.Classes.SelectMany(cl => cl.Enrollments).Count(),
                    TotalAssignments = course.Classes.SelectMany(cl => cl.Assignments).Count(),
                    TotalSubmissions = course.Classes.SelectMany(cl => cl.Assignments).SelectMany(a => a.Submissions).Count(),
                    AverageGrade = await CalculateAverageGradeForCourseAsync(course.Id)
                });
            }

            return Result<List<CourseStatisticsDto>>.Success(statistics);
        }

        public async Task<Result<List<DepartmentStatisticsDto>>> GetDepartmentStatisticsAsync()
        {
            var courses = await _courseRepository.GetAllAsync();
            var departmentGroups = courses.GroupBy(c => c.Department);

            var statistics = new List<DepartmentStatisticsDto>();
            foreach (var group in departmentGroups)
            {
                statistics.Add(new DepartmentStatisticsDto
                {
                    Department = group.Key,
                    TotalCourses = group.Count(),
                    TotalClasses = group.SelectMany(c => c.Classes).Count(),
                    TotalStudents = group.SelectMany(c => c.Classes).SelectMany(cl => cl.Enrollments).Count(),
                    TotalInstructors = group.SelectMany(c => c.Classes).Select(cl => cl.InstructorId).Distinct().Count(),
                    AverageGrade = await CalculateAverageGradeForDepartmentAsync(group.Key)
                });
            }

            return Result<List<DepartmentStatisticsDto>>.Success(statistics);
        }

        public async Task<Result<List<ClassStatisticsDto>>> GetClassStatisticsByInstructorAsync(int instructorId)
        {
            var classes = await _classRepository.GetByInstructorIdAsync(instructorId);

            var statistics = new List<ClassStatisticsDto>();
            foreach (var classEntity in classes)
            {
                var enrollmentCount = await _enrollmentRepository.GetEnrollmentCountByClassIdAsync(classEntity.Id);
                
                // Her ödev için UNIQUE öğrenci submission sayısını hesapla
                // (Bir öğrenci aynı ödeve birden fazla kez submission yapabilir, ama sadece bir kez sayılmalı)
                var totalSubmissions = 0;
                var pendingSubmissions = 0;
                
                foreach (var assignment in classEntity.Assignments)
                {
                    // Her ödev için unique öğrenci sayısını bul (bir öğrenci birden fazla submission yapmış olabilir)
                    // ÖNEMLİ: Sadece gerçek submission'ları say (FilePath'i olan VE FileSizeInBytes > 0 olan, yani öğrenci tarafından dosya yüklenmiş olan)
                    // Otomatik 0 notları için oluşturulan submission'ları sayma (bunların FilePath'i boş veya FileSizeInBytes = 0)
                    var realSubmissions = assignment.Submissions?
                        .Where(s => 
                            !string.IsNullOrWhiteSpace(s.FilePath) && // Dosya yolu var
                            s.FileSizeInBytes > 0 && // Dosya boyutu 0'dan büyük
                            s.Status == Domain.Enums.SubmissionStatus.Submitted // Status Submitted
                        )
                        .ToList() ?? new List<Domain.Entities.Submission>();
                    
                    var uniqueStudentSubmissions = realSubmissions
                        .Select(s => s.StudentId)
                        .Distinct()
                        .Count();
                    
                    totalSubmissions += uniqueStudentSubmissions;
                    // Bekleyen submission = Toplam öğrenci sayısı - Bu ödev için teslim eden UNIQUE öğrenci sayısı
                    pendingSubmissions += Math.Max(0, enrollmentCount - uniqueStudentSubmissions);
                }
                
                statistics.Add(new ClassStatisticsDto
                {
                    ClassId = classEntity.Id,
                    ClassName = classEntity.ClassName,
                    CourseCode = classEntity.Course.CourseCode,
                    TotalStudents = enrollmentCount,
                    TotalAssignments = classEntity.Assignments.Count,
                    TotalSubmissions = totalSubmissions, // Artık unique student-assignment çiftleri sayısı
                    PendingSubmissions = pendingSubmissions,
                    AverageGrade = await CalculateAverageGradeForClassAsync(classEntity.Id)
                });
            }

            return Result<List<ClassStatisticsDto>>.Success(statistics);
        }

        // Helper methods
        private async Task<double> CalculateAverageGradeForCourseAsync(int courseId)
        {
            var grades = await _gradeRepository.GetByCourseIdAsync(courseId);
            return grades.Any() ? grades.Average(g => (double)g.Score / g.Submission.Assignment.MaxScore * 100) : 0;
        }

        private async Task<double> CalculateAverageGradeForDepartmentAsync(string department)
        {
            var courses = await _courseRepository.GetByDepartmentAsync(department);
            var courseIds = courses.Select(c => c.Id).ToList();
            
            var allGrades = new List<Domain.Entities.Grade>();
            foreach (var courseId in courseIds)
            {
                var courseGrades = await _gradeRepository.GetByCourseIdAsync(courseId);
                allGrades.AddRange(courseGrades);
            }
            
            return allGrades.Any() ? allGrades.Average(g => (double)g.Score / g.Submission.Assignment.MaxScore * 100) : 0;
        }

        private async Task<double> CalculateAverageGradeForClassAsync(int classId)
        {
            var grades = await _gradeRepository.GetByClassIdAsync(classId);
            if (!grades.Any())
                return 0;
            
            var average = grades.Average(g => 
            {
                var maxScore = g.Submission?.Assignment?.MaxScore ?? 100;
                if (maxScore <= 0) maxScore = 100;
                return (double)g.Score / maxScore * 100;
            });
            
            // 2 ondalık basamağa yuvarla
            return Math.Round(average, 2);
        }

        private async Task<List<RecentActivityDto>> GetRecentActivitiesAsync()
        {
            // Get recent submissions from all assignments
            var assignments = await _assignmentRepository.GetAllAsync();
            var recentSubmissions = new List<Domain.Entities.Submission>();
            
            foreach (var assignment in assignments.Take(20)) // Limit to prevent performance issues
            {
                var submissions = await _submissionRepository.GetByAssignmentIdAsync(assignment.Id);
                recentSubmissions.AddRange(submissions);
            }

            var activities = recentSubmissions
                .OrderByDescending(s => s.CreatedAt)
                .Take(10)
                .Select(s => new RecentActivityDto
                {
                    ActivityType = "Submission",
                    Description = $"New submission for {s.Assignment.Title}",
                    UserName = $"{s.Student.FirstName} {s.Student.LastName}",
                    UserRole = "Student",
                    ActivityTime = s.CreatedAt,
                    TimeAgo = CalculateTimeAgo(s.CreatedAt),
                    RelatedEntity = "Assignment",
                    RelatedEntityId = s.AssignmentId
                }).ToList();

            return activities;
        }

        private string CalculateTimeAgo(DateTime dateTime)
        {
            var timeSpan = DateTime.UtcNow - dateTime;
            
            if (timeSpan.TotalDays >= 1)
                return $"{(int)timeSpan.TotalDays} days ago";
            if (timeSpan.TotalHours >= 1)
                return $"{(int)timeSpan.TotalHours} hours ago";
            if (timeSpan.TotalMinutes >= 1)
                return $"{(int)timeSpan.TotalMinutes} minutes ago";
            
            return "Just now";
        }
    }
}