# Implementasyon Planı - Özellikler

## ✅ Tamamlanan

1. **ClassSchedule Controller ve Service** ✅
   - DTOs oluşturuldu
   - Service implementasyonu yapıldı
   - Controller oluşturuldu
   - Program.cs'e eklendi

2. **Instructor Öğrenci Filtreleme** ✅
   - DTO oluşturuldu (`InstructorStudentsResponseDto`)
   - Service method eklendi (`GetInstructorStudentsAsync`)
   - Interface güncellendi

## 🔄 Devam Eden

3. **Grup Üye Yönetimi**
   - DTOs oluşturuldu (`AddGroupMemberRequestDto`, `RemoveGroupMemberRequestDto`)
   - Interface'e methodlar eklenecek
   - Service implementasyonu yapılacak (deadline kontrolü ile)
   - Controller endpoint'leri eklenecek

4. **Submission Grup Lideri Kontrolü**
   - SubmissionService'e grup lideri kontrolü eklenecek
   - IGroupService dependency eklenecek

5. **UserController Endpoint**
   - `GET /User/my-students` endpoint'i eklenecek

6. **GroupController Endpoint'leri**
   - `POST /Group/{groupId}/add-member` eklenecek
   - `POST /Group/{groupId}/remove-member` eklenecek

## 📝 Notlar

- Submission entity'sinde `GroupId` zaten var ✅
- Deadline kontrolü için Assignment.DueDate kullanılacak
- Grup lideri kontrolü için IGroupService.IsStudentGroupLeaderAsync kullanılacak
