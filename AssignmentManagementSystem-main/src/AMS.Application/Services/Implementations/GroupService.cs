using AMS.Application.Common.Exceptions;
using AMS.Application.Common.Results;
using AMS.Application.DTOs.Group;
using AMS.Application.Services.Interfaces;
using AMS.Domain.Entities;
using AMS.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AMS.Application.Services.Implementations
{
    public class GroupService : IGroupService
    {
        private readonly IAssignmentGroupRepository _groupRepository;
        private readonly IGroupMemberRepository _memberRepository;
        private readonly IAssignmentRepository _assignmentRepository;
        private readonly IUserRepository _userRepository;
        private readonly IEnrollmentRepository _enrollmentRepository;
        private readonly ISubmissionRepository _submissionRepository;

        public GroupService(
            IAssignmentGroupRepository groupRepository,
            IGroupMemberRepository memberRepository,
            IAssignmentRepository assignmentRepository,
            IUserRepository userRepository,
            IEnrollmentRepository enrollmentRepository,
            ISubmissionRepository submissionRepository)
        {
            _groupRepository = groupRepository;
            _memberRepository = memberRepository;
            _assignmentRepository = assignmentRepository;
            _userRepository = userRepository;
            _enrollmentRepository = enrollmentRepository;
            _submissionRepository = submissionRepository;
        }

        public async Task<Result<GroupResponseDto>> CreateGroupAsync(CreateGroupRequestDto request, int leaderStudentId)
        {
            Console.WriteLine($"?? Creating group: {request.GroupName} for Assignment: {request.AssignmentId}");
            Console.WriteLine($"?? Leader: {leaderStudentId}, Members: [{string.Join(",", request.MemberIds)}]");

            // 1. Assignment kontrol�
            var assignment = await _assignmentRepository.GetByIdAsync(request.AssignmentId);
            if (assignment == null)
            {
                return Result<GroupResponseDto>.Failure("Assignment not found");
            }

            if (assignment.Type != Domain.Enums.AssignmentType.Group)
            {
                return Result<GroupResponseDto>.Failure("This is not a group assignment");
            }

            Console.WriteLine($"? Assignment validated: {assignment.Title} (Group Assignment)");

            // 2. Grup ad? benzersiz mi?
            var groupExists = await _groupRepository.ExistsByNameAndAssignmentAsync(request.GroupName, request.AssignmentId);
            if (groupExists)
            {
                return Result<GroupResponseDto>.Failure("Group name already exists for this assignment");
            }

            // 3. Leader zaten bir grupta m??
            var existingGroup = await _memberRepository.GetStudentGroupAsync(request.AssignmentId, leaderStudentId);
            if (existingGroup != null)
            {
                return Result<GroupResponseDto>.Failure("You are already in a group for this assignment");
            }

            // 4. T�m �yeler s?n?fa kay?tl? m??
            var classEnrollments = await _enrollmentRepository.GetByClassIdAsync(assignment.ClassId);
            var enrolledStudentIds = classEnrollments.Select(e => e.StudentId).ToHashSet();

            // Leader'? da member listesine ekle (e?er yoksa)
            var allMemberIds = new HashSet<int>(request.MemberIds);
            allMemberIds.Add(leaderStudentId);

            Console.WriteLine($"?? Total members (including leader): {allMemberIds.Count}");

            foreach (var memberId in allMemberIds)
            {
                if (!enrolledStudentIds.Contains(memberId))
                {
                    var user = await _userRepository.GetByIdAsync(memberId);
                    return Result<GroupResponseDto>.Failure($"Student {user?.FirstName} {user?.LastName} is not enrolled in this class");
                }
            }

            // 5. �yeler ba?ka grupta m? kontrol et
            foreach (var memberId in allMemberIds)
            {
                var memberExistingGroup = await _memberRepository.GetStudentGroupAsync(request.AssignmentId, memberId);
                if (memberExistingGroup != null)
                {
                    var user = await _userRepository.GetByIdAsync(memberId);
                    return Result<GroupResponseDto>.Failure($"Student {user?.FirstName} {user?.LastName} is already in another group");
                }
            }

            Console.WriteLine($"? All validations passed");

            // 6. Grup olu?tur
            var group = new AssignmentGroup
            {
                AssignmentId = request.AssignmentId,
                GroupName = request.GroupName,
                CreatedAt = DateTime.UtcNow
            };

            await _groupRepository.AddAsync(group);
            await _groupRepository.SaveChangesAsync();

            Console.WriteLine($"? Group created with ID: {group.Id}");

            // 7. �yeleri ekle
            var members = new List<GroupMember>();

            // Leader'? ekle
            var leaderMember = new GroupMember
            {
                GroupId = group.Id,
                StudentId = leaderStudentId,
                IsLeader = true,
                CreatedAt = DateTime.UtcNow
            };
            members.Add(leaderMember);

            // Di?er �yeleri ekle
            foreach (var memberId in request.MemberIds)
            {
                if (memberId != leaderStudentId) // Leader zaten eklendi
                {
                    var member = new GroupMember
                    {
                        GroupId = group.Id,
                        StudentId = memberId,
                        IsLeader = false,
                        CreatedAt = DateTime.UtcNow
                    };
                    members.Add(member);
                }
            }

            foreach (var member in members)
            {
                await _memberRepository.AddAsync(member);
            }
            await _memberRepository.SaveChangesAsync();

            Console.WriteLine($"? Added {members.Count} members to group");
            
            // ✅ LOG: Grup oluşturuldu ve üyeler eklendi
            var leaderUser = await _userRepository.GetByIdAsync(leaderStudentId);
            var memberNames = new List<string>();
            foreach (var member in members)
            {
                var memberUser = await _userRepository.GetByIdAsync(member.StudentId);
                if (memberUser != null)
                {
                    memberNames.Add($"{memberUser.FirstName} {memberUser.LastName} (ID: {member.StudentId})");
                }
            }
            Console.WriteLine($"[GROUP_LOG] Grup oluşturuldu - Grup: {request.GroupName} (ID: {group.Id}), " +
                $"Assignment: {assignment.Title} (ID: {assignment.Id}), " +
                $"Lider: {leaderUser?.FirstName} {leaderUser?.LastName} (ID: {leaderStudentId}), " +
                $"Üyeler: {string.Join(", ", memberNames)}, " +
                $"Zaman: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");

            // 8. Response olu?tur
            var response = await BuildGroupResponseAsync(group, assignment);

            return Result<GroupResponseDto>.Success(response, "Group created successfully");
        }

        public async Task<Result<GroupResponseDto?>> GetMyGroupAsync(int assignmentId, int studentId)
        {
            var group = await _memberRepository.GetStudentGroupAsync(assignmentId, studentId);
            
            if (group == null)
            {
                return Result<GroupResponseDto?>.Success(null);
            }

            var assignment = await _assignmentRepository.GetByIdAsync(assignmentId);
            var response = await BuildGroupResponseAsync(group, assignment!);

            return Result<GroupResponseDto?>.Success(response);
        }

        public async Task<Result<List<AvailableStudentDto>>> GetAvailableStudentsAsync(int assignmentId, int currentStudentId)
        {
            var assignment = await _assignmentRepository.GetByIdAsync(assignmentId);
            if (assignment == null)
            {
                return Result<List<AvailableStudentDto>>.Failure("Assignment not found");
            }

            // S?n?fa kay?tl? �?rencileri al
            var enrollments = await _enrollmentRepository.GetByClassIdAsync(assignment.ClassId);
            var students = new List<AvailableStudentDto>();

            foreach (var enrollment in enrollments)
            {
                // Kendini dahil etme
                if (enrollment.StudentId == currentStudentId)
                    continue;

                var student = enrollment.Student;
                var isInGroup = await _memberRepository.IsStudentInGroupAsync(assignmentId, enrollment.StudentId);

                students.Add(new AvailableStudentDto
                {
                    StudentId = student.Id,
                    StudentName = $"{student.FirstName} {student.LastName}",
                    StudentNumber = student.StudentNumber ?? "",
                    IsInGroup = isInGroup
                });
            }

            return Result<List<AvailableStudentDto>>.Success(students.OrderBy(s => s.StudentNumber).ToList());
        }

        public async Task<Result<List<GroupResponseDto>>> GetAssignmentGroupsAsync(int assignmentId)
        {
            var groups = await _groupRepository.GetByAssignmentIdAsync(assignmentId);
            var assignment = await _assignmentRepository.GetByIdAsync(assignmentId);
            var response = new List<GroupResponseDto>();

            foreach (var group in groups)
            {
                response.Add(await BuildGroupResponseAsync(group, assignment!));
            }

            return Result<List<GroupResponseDto>>.Success(response);
        }

        public async Task<Result<List<GroupResponseDto>>> GetInstructorGroupsAsync(int assignmentId, int instructorId)
        {
            var assignment = await _assignmentRepository.GetByIdAsync(assignmentId);
            
            if (assignment?.Class.InstructorId != instructorId)
            {
                return Result<List<GroupResponseDto>>.Failure("You don't have permission to view these groups");
            }

            return await GetAssignmentGroupsAsync(assignmentId);
        }

        public async Task<Result<GroupResponseDto>> GetGroupDetailsAsync(int groupId)
        {
            var group = await _groupRepository.GetGroupWithMembersAsync(groupId);
            
            if (group == null)
            {
                throw new NotFoundException("Group", groupId);
            }

            var response = await BuildGroupResponseAsync(group, group.Assignment);
            return Result<GroupResponseDto>.Success(response);
        }

        public async Task<Result<bool>> CanCreateGroupAsync(int assignmentId, int studentId)
        {
            // Assignment grup �devi mi?
            var assignment = await _assignmentRepository.GetByIdAsync(assignmentId);
            if (assignment?.Type != Domain.Enums.AssignmentType.Group)
            {
                return Result<bool>.Success(false);
            }

            // �?renci zaten bir grupta m??
            var existingGroup = await _memberRepository.IsStudentInGroupAsync(assignmentId, studentId);
            return Result<bool>.Success(!existingGroup);
        }

        public async Task<Result<bool>> IsStudentGroupLeaderAsync(int groupId, int studentId)
        {
            var members = await _memberRepository.GetGroupMembersAsync(groupId);
            var leader = members.FirstOrDefault(m => m.IsLeader && m.StudentId == studentId);
            
            return Result<bool>.Success(leader != null);
        }

        // ? MOB?L ?�?N EKLEND? - Group leadership kontrol�
        public async Task<bool> IsUserGroupLeaderAsync(int groupId, int userId)
        {
            var members = await _memberRepository.GetGroupMembersAsync(groupId);
            var leader = members.FirstOrDefault(m => m.IsLeader && m.StudentId == userId);
            
            return leader != null;
        }

        private async Task<GroupResponseDto> BuildGroupResponseAsync(AssignmentGroup group, Assignment assignment)
        {
            var leader = group.Members.FirstOrDefault(m => m.IsLeader);
            var leaderUser = leader != null ? await _userRepository.GetByIdAsync(leader.StudentId) : null;

            var memberDtos = new List<GroupMemberDto>();
            foreach (var member in group.Members)
            {
                var user = await _userRepository.GetByIdAsync(member.StudentId);
                memberDtos.Add(new GroupMemberDto
                {
                    StudentId = member.StudentId,
                    StudentName = $"{user!.FirstName} {user.LastName}",
                    StudentNumber = user.StudentNumber ?? "",
                    IsLeader = member.IsLeader
                });
            }

            // Grup submission'? var m? kontrol et
            var hasSubmission = false;
            if (group.Id > 0)
            {
                var submissions = await _submissionRepository.GetByGroupIdAsync(group.Id);
                hasSubmission = submissions.Any();
            }

            return new GroupResponseDto
            {
                Id = group.Id,
                GroupName = group.GroupName,
                AssignmentId = group.AssignmentId,
                AssignmentTitle = assignment.Title,
                LeaderStudentId = leader?.StudentId ?? 0,
                LeaderName = leaderUser != null ? $"{leaderUser.FirstName} {leaderUser.LastName}" : "",
                CreatedAt = group.CreatedAt,
                HasSubmission = hasSubmission,
                Members = memberDtos.OrderBy(m => m.IsLeader ? 0 : 1).ThenBy(m => m.StudentNumber).ToList()
            };
        }

        public async Task<Result<GroupResponseDto>> AddGroupMemberAsync(int groupId, int studentId, int leaderStudentId)
        {
            // 1. Grup var mı kontrol et
            var group = await _groupRepository.GetGroupWithMembersAsync(groupId);
            if (group == null)
            {
                return Result<GroupResponseDto>.Failure("Group not found");
            }

            // 2. Lider kontrolü
            var isLeader = await IsUserGroupLeaderAsync(groupId, leaderStudentId);
            if (!isLeader)
            {
                return Result<GroupResponseDto>.Failure("Sadece grup lideri üye ekleyebilir");
            }

            // 3. Öğrenci zaten grupta mı?
            var existingMember = group.Members.FirstOrDefault(m => m.StudentId == studentId);
            if (existingMember != null)
            {
                return Result<GroupResponseDto>.Failure("Öğrenci zaten bu grupta");
            }

            // 4. Öğrenci başka bir grupta mı?
            var assignment = await _assignmentRepository.GetByIdAsync(group.AssignmentId);
            var isInAnotherGroup = await _memberRepository.IsStudentInGroupAsync(assignment!.Id, studentId);
            if (isInAnotherGroup)
            {
                return Result<GroupResponseDto>.Failure("Öğrenci bu ödev için başka bir grupta zaten bulunuyor");
            }

            // ✅ 5. Grup ödevi teslim edilmiş mi kontrol et
            var groupSubmissions = await _submissionRepository.GetByGroupIdAsync(groupId);
            var hasRealSubmission = groupSubmissions.Any(s => 
                !string.IsNullOrWhiteSpace(s.FilePath) && 
                s.FileSizeInBytes > 0 && 
                (s.Status == Domain.Enums.SubmissionStatus.Submitted || 
                 s.Status == Domain.Enums.SubmissionStatus.Late || 
                 s.Status == Domain.Enums.SubmissionStatus.Resubmitted));
            
            if (hasRealSubmission)
            {
                Console.WriteLine($"[GROUP_LOG] Üye ekleme engellendi - Grup {groupId} için ödev teslim edilmiş");
                return Result<GroupResponseDto>.Failure("Ödev teslim edildikten sonra üye eklenemez");
            }

            // 6. Öğrenci sınıfa kayıtlı mı?
            var enrollments = await _enrollmentRepository.GetByClassIdAsync(assignment.ClassId);
            var isEnrolled = enrollments.Any(e => e.StudentId == studentId && e.IsActive && !e.IsDeleted);
            if (!isEnrolled)
            {
                return Result<GroupResponseDto>.Failure("Student is not enrolled in this class");
            }

            // 6. Üyeyi ekle
            var newMember = new GroupMember
            {
                GroupId = groupId,
                StudentId = studentId,
                IsLeader = false,
                CreatedAt = DateTime.UtcNow
            };

            await _memberRepository.AddAsync(newMember);
            await _memberRepository.SaveChangesAsync();

            // ✅ LOG: Üye eklendi
            var addedStudent = await _userRepository.GetByIdAsync(studentId);
            var leaderUser = await _userRepository.GetByIdAsync(leaderStudentId);
            Console.WriteLine($"[GROUP_LOG] Üye eklendi - Grup: {group.GroupName} (ID: {groupId}), Assignment: {assignment.Title} (ID: {assignment.Id}), " +
                $"Eklenen Öğrenci: {addedStudent?.FirstName} {addedStudent?.LastName} (ID: {studentId}), " +
                $"Lider: {leaderUser?.FirstName} {leaderUser?.LastName} (ID: {leaderStudentId}), " +
                $"Zaman: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");

            // 7. Güncellenmiş grup bilgisini döndür
            var updatedGroup = await _groupRepository.GetGroupWithMembersAsync(groupId);
            var response = await BuildGroupResponseAsync(updatedGroup!, assignment);
            
            return Result<GroupResponseDto>.Success(response, "Member added successfully");
        }

        public async Task<Result<GroupResponseDto>> RemoveGroupMemberAsync(int groupId, int studentId, int leaderStudentId)
        {
            // 1. Grup var mı kontrol et
            var group = await _groupRepository.GetGroupWithMembersAsync(groupId);
            if (group == null)
            {
                return Result<GroupResponseDto>.Failure("Grup bulunamadı");
            }

            // 2. Lider kontrolü
            var isLeader = await IsUserGroupLeaderAsync(groupId, leaderStudentId);
            if (!isLeader)
            {
                return Result<GroupResponseDto>.Failure("Sadece grup lideri üye çıkarabilir");
            }

            // 3. Üye grupta mı?
            var member = group.Members.FirstOrDefault(m => m.StudentId == studentId);
            if (member == null)
            {
                return Result<GroupResponseDto>.Failure("Öğrenci bu grubun üyesi değil");
            }

            // 4. Lideri çıkaramaz
            if (member.IsLeader)
            {
                return Result<GroupResponseDto>.Failure("Grup lideri çıkarılamaz");
            }

            // ✅ 5. Grup ödevi teslim edilmiş mi kontrol et
            var groupSubmissions = await _submissionRepository.GetByGroupIdAsync(groupId);
            var hasRealSubmission = groupSubmissions.Any(s => 
                !string.IsNullOrWhiteSpace(s.FilePath) && 
                s.FileSizeInBytes > 0 && 
                (s.Status == Domain.Enums.SubmissionStatus.Submitted || 
                 s.Status == Domain.Enums.SubmissionStatus.Late || 
                 s.Status == Domain.Enums.SubmissionStatus.Resubmitted));
            
            if (hasRealSubmission)
            {
                Console.WriteLine($"[GROUP_LOG] Üye çıkarma engellendi - Grup {groupId} için ödev teslim edilmiş");
                return Result<GroupResponseDto>.Failure("Ödev teslim edildikten sonra üye çıkarılamaz");
            }

            // 6. Üyeyi çıkar
            await _memberRepository.DeleteAsync(member);
            await _memberRepository.SaveChangesAsync();

            // ✅ LOG: Üye çıkarıldı
            var assignment = await _assignmentRepository.GetByIdAsync(group.AssignmentId);
            var removedStudent = await _userRepository.GetByIdAsync(studentId);
            var leaderUser = await _userRepository.GetByIdAsync(leaderStudentId);
            Console.WriteLine($"[GROUP_LOG] Üye çıkarıldı - Grup: {group.GroupName} (ID: {groupId}), Assignment: {assignment!.Title} (ID: {assignment.Id}), " +
                $"Çıkarılan Öğrenci: {removedStudent?.FirstName} {removedStudent?.LastName} (ID: {studentId}), " +
                $"Lider: {leaderUser?.FirstName} {leaderUser?.LastName} (ID: {leaderStudentId}), " +
                $"Zaman: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");

            // 7. Güncellenmiş grup bilgisini döndür
            var updatedGroup = await _groupRepository.GetGroupWithMembersAsync(groupId);
            var response = await BuildGroupResponseAsync(updatedGroup!, assignment!);
            
            return Result<GroupResponseDto>.Success(response, "Member removed successfully");
        }
    }
}