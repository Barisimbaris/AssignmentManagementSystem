# ?? Assignment Management System (AMS) - Complete API Documentation

## ?? System Overview
Assignment Management System (AMS) is a comprehensive educational platform for managing courses, classes, assignments, submissions, grades, and schedules. The system supports multiple user roles (Admin, Instructor, Student) with role-based access control.

---

## ??? Database Design

### Core Entities Structure

```
?? DATABASE SCHEMA
??? Users (Authentication & User Management)
??? Courses (Course Catalog)  
??? Classes (Course Implementations)
??? ClassSchedules (Time/Room Management) ?
??? Enrollments (Student-Class Relationships)
??? Assignments (Individual/Group Tasks)
??? AssignmentGroups (Group Assignment Management) ?
??? GroupMembers (Group Membership) ?
??? Submissions (Student Work)
??? Grades (Assessment Results)
??? Notifications (System Communication) ?
??? CourseInstructors (Course-Instructor Mapping) ?
```

### Entity Relationships

```sql
Users (1) ??? (Many) Classes [as Instructor]
Users (1) ??? (Many) Enrollments [as Student]
Users (1) ??? (Many) Submissions [as Student]
Users (1) ??? (Many) Grades [as Instructor]

Courses (1) ??? (Many) Classes
Classes (1) ??? (Many) Enrollments
Classes (1) ??? (Many) Assignments
Classes (1) ??? (Many) ClassSchedules ?

Assignments (1) ??? (Many) Submissions
Assignments (1) ??? (Many) AssignmentGroups ?
AssignmentGroups (1) ??? (Many) GroupMembers ?

Submissions (1) ??? (One) Grade
```

---

## ?? API Endpoints Catalog

### ?? **1. Authentication Controller** - `/api/Auth`

| Method | Endpoint | Purpose | Database Impact |
|--------|----------|---------|-----------------|
| `POST` | `/register` | User registration | **Creates**: User record with hashed password |
| `POST` | `/login` | User authentication | **Reads**: User credentials, generates JWT token |
| `POST` | `/change-password` | Password modification | **Updates**: User.PasswordHash |

**Database Operations:**
- **Users table**: Create, Read, Update
- **Security**: BCrypt password hashing, JWT token generation

---

### ?? **2. User Controller** - `/api/User`

| Method | Endpoint | Purpose | Database Impact |
|--------|----------|---------|-----------------|
| `GET` | `/{id}` | Get user by ID | **Reads**: Single user record |
| `GET` | `/email/{email}` | Get user by email | **Reads**: User by email lookup |
| `GET` | `/` | Get all users (Admin) | **Reads**: All user records |
| `GET` | `/students` | Get all students | **Reads**: Users with Student role |
| `GET` | `/instructors` | Get all instructors | **Reads**: Users with Instructor role |
| `GET` | `/profile` | Get current user profile | **Reads**: Authenticated user data |
| `PUT` | `/profile` | Update user profile | **Updates**: User profile fields |
| `DELETE` | `/{id}` | Delete user (Admin) | **Soft Delete**: Sets IsDeleted = true |
| `POST` | `/bulk-import` | Bulk user creation | **Creates**: Multiple user records |
| `GET` | `/bulk-import-template` | Download CSV template | **No DB impact** - File download |

**Database Operations:**
- **Users table**: Full CRUD operations
- **Bulk Operations**: Batch insert with error handling
- **Soft Delete**: Maintains data integrity

---

### ?? **3. Course Controller** - `/api/Course`

| Method | Endpoint | Purpose | Database Impact |
|--------|----------|---------|-----------------|
| `GET` | `/` | Get all courses | **Reads**: All course records |
| `GET` | `/{id}` | Get course by ID | **Reads**: Single course with classes |
| `POST` | `/` | Create new course | **Creates**: Course record |
| `PUT` | `/{id}` | Update course | **Updates**: Course fields |
| `DELETE` | `/{id}` | Delete course | **Soft Delete**: Course and related data |
| `POST` | `/{courseId}/assign-instructor` | Assign instructor | **Creates**: CourseInstructor mapping |
| `GET` | `/{courseId}/instructors` | Get course instructors | **Reads**: CourseInstructor relationships |

**Database Operations:**
- **Courses table**: CRUD operations
- **CourseInstructors table**: Instructor assignments
- **Cascade Operations**: Related classes affected

---

### ?? **4. Class Controller** - `/api/Class`

| Method | Endpoint | Purpose | Database Impact |
|--------|----------|---------|-----------------|
| `GET` | `/` | Get all classes | **Reads**: Classes with course/instructor data |
| `GET` | `/{id}` | Get class details | **Reads**: Class with enrollments/assignments |
| `POST` | `/` | Create new class | **Creates**: Class record |
| `PUT` | `/{id}` | Update class | **Updates**: Class fields |
| `DELETE` | `/{id}` | Delete class | **Soft Delete**: Class and dependencies |
| `POST` | `/{classId}/enroll/{studentId}` | Enroll student | **Creates**: Enrollment record, **Updates**: CurrentEnrollment |
| `POST` | `/{classId}/unenroll/{studentId}` | Unenroll student | **Soft Delete**: Enrollment, **Updates**: CurrentEnrollment |
| `GET` | `/instructor/{instructorId}` | Get instructor classes | **Reads**: Classes by instructor |

**Database Operations:**
- **Classes table**: CRUD operations
- **Enrollments table**: Student registrations
- **Capacity Management**: Automatic enrollment counting

---

### ? **5. Schedule Controller** - `/api/Schedule` ?

| Method | Endpoint | Purpose | Database Impact |
|--------|----------|---------|-----------------|
| `GET` | `/` | Get all schedules | **Reads**: All active schedules |
| `GET` | `/{id}` | Get schedule by ID | **Reads**: Single schedule record |
| `POST` | `/` | Create schedule | **Creates**: ClassSchedule with conflict check |
| `PUT` | `/{id}` | Update schedule | **Updates**: Schedule fields |
| `DELETE` | `/{id}` | Delete schedule | **Soft Delete**: Schedule record |
| `GET` | `/class/{classId}` | Get class schedules | **Reads**: Schedules for specific class |
| `GET` | `/instructor/{instructorId}` | Get instructor schedule | **Reads**: All instructor schedules |
| `GET` | `/day/{dayOfWeek}` | Get daily schedules | **Reads**: Schedules by day (0-6) |
| `POST` | `/conflicts` | Check schedule conflicts | **Reads**: Overlap detection |
| `POST` | `/bulk` | Create multiple schedules | **Creates**: Batch schedule creation |

**Database Operations:**
- **ClassSchedules table**: CRUD operations
- **Conflict Detection**: Time/room overlap prevention
- **Index Optimization**: Day/time/room indexing

---

### ?? **6. Assignment Controller** - `/api/Assignment`

| Method | Endpoint | Purpose | Database Impact |
|--------|----------|---------|-----------------|
| `GET` | `/` | Get all assignments | **Reads**: All assignment records |
| `GET` | `/{id}` | Get assignment details | **Reads**: Assignment with submissions/groups |
| `POST` | `/` | Create assignment | **Creates**: Assignment record |
| `PUT` | `/{id}` | Update assignment | **Updates**: Assignment fields |
| `DELETE` | `/{id}` | Delete assignment | **Soft Delete**: Assignment and submissions |
| `GET` | `/class/{classId}` | Get class assignments | **Reads**: Assignments by class |
| `GET` | `/instructor/{instructorId}` | Get instructor assignments | **Reads**: Assignments by instructor |
| `GET` | `/student/{studentId}` | Get student assignments | **Reads**: Student-visible assignments |

**Database Operations:**
- **Assignments table**: CRUD operations
- **Type Support**: Individual (1) and Group (2) assignments
- **Deadline Management**: Due date tracking

---

### ?? **7. Group Controller** - `/api/Group` ?

| Method | Endpoint | Purpose | Database Impact |
|--------|----------|---------|-----------------|
| `POST` | `/create` | Create assignment group | **Creates**: AssignmentGroup + GroupMembers |
| `GET` | `/my-group/{assignmentId}` | Get student's group | **Reads**: Student's group for assignment |
| `GET` | `/available-students/{assignmentId}` | Get available students | **Reads**: Unassigned students in class |
| `GET` | `/assignment/{assignmentId}` | Get assignment groups | **Reads**: All groups for assignment |
| `GET` | `/{groupId}` | Get group details | **Reads**: Group with member details |
| `POST` | `/{groupId}/add-member` | Add group member | **Creates**: GroupMember record |
| `POST` | `/{groupId}/remove-member` | Remove group member | **Soft Delete**: GroupMember record |
| `POST` | `/{groupId}/leave` | Leave group | **Soft Delete**: Student's membership |

**Database Operations:**
- **AssignmentGroups table**: Group management
- **GroupMembers table**: Membership tracking
- **Leadership System**: First member = leader
- **Constraint Enforcement**: One group per assignment per student

---

### ?? **8. Submission Controller** - `/api/Submission`

| Method | Endpoint | Purpose | Database Impact |
|--------|----------|---------|-----------------|
| `GET` | `/{id}` | Get submission details | **Reads**: Submission with file info |
| `GET` | `/assignment/{assignmentId}` | Get assignment submissions | **Reads**: All submissions for assignment |
| `GET` | `/my-submissions` | Get student submissions | **Reads**: Current student's submissions |
| `POST` | `/` | Submit assignment | **Creates**: Submission + file upload |
| `PUT` | `/{id}/resubmit` | Resubmit assignment | **Updates**: Submission + new file |
| `DELETE` | `/{id}` | Delete submission | **Soft Delete**: Submission + file removal |
| `GET` | `/{id}/download` | Download submission file | **No DB impact** - File download |

**Database Operations:**
- **Submissions table**: CRUD operations
- **File Management**: Upload/download/delete
- **Group Support**: GroupId for group submissions
- **Leadership Validation**: Only group leaders can submit

---

### ?? **9. Grade Controller** - `/api/Grade`

| Method | Endpoint | Purpose | Database Impact |
|--------|----------|---------|-----------------|
| `GET` | `/{id}` | Get grade details | **Reads**: Single grade record |
| `GET` | `/submission/{submissionId}` | Get submission grade | **Reads**: Grade for specific submission |
| `GET` | `/student/{studentId}` | Get student grades | **Reads**: All grades for student |
| `GET` | `/assignment/{assignmentId}` | Get assignment grades | **Reads**: All grades for assignment |
| `POST` | `/` | Create grade | **Creates**: Grade record |
| `PUT` | `/{id}` | Update grade | **Updates**: Grade score/feedback |
| `DELETE` | `/{id}` | Delete grade | **Soft Delete**: Grade record |
| `POST` | `/{id}/publish` | Publish grade | **Updates**: IsPublished = true |

**Database Operations:**
- **Grades table**: CRUD operations
- **Publication Control**: Visibility management
- **Feedback System**: Text feedback with scores

---

### ?? **10. Notification Controller** - `/api/Notification` ?

| Method | Endpoint | Purpose | Database Impact |
|--------|----------|---------|-----------------|
| `GET` | `/my-notifications` | Get user notifications | **Reads**: User's notification feed |
| `GET` | `/unread-count` | Get unread count | **Reads**: Count of unread notifications |
| `POST` | `/{id}/mark-read` | Mark as read | **Updates**: IsRead = true |
| `POST` | `/mark-all-read` | Mark all as read | **Updates**: All notifications IsRead = true |
| `DELETE` | `/{id}` | Delete notification | **Soft Delete**: Notification record |

**Database Operations:**
- **Notifications table**: Read/Update operations
- **Real-time Updates**: Notification status tracking
- **Bulk Operations**: Mass read marking

---

### ?? **11. Dashboard Controller** - `/api/Dashboard` ?

| Method | Endpoint | Purpose | Database Impact |
|--------|----------|---------|-----------------|
| `GET` | `/admin` | Admin dashboard data | **Reads**: System-wide statistics |
| `GET` | `/instructor` | Instructor dashboard | **Reads**: Instructor's class/assignment data |
| `GET` | `/student` | Student dashboard | **Reads**: Student's course/assignment data |

**Database Operations:**
- **Multi-table Aggregation**: Statistics from all entities
- **Performance Optimized**: Efficient queries
- **Role-based Data**: Filtered by user permissions

---

## ??? Database Schema Details

### **Core Tables**

#### **Users**
```sql
- Id (PK)
- FirstName, LastName
- Email (Unique)
- PasswordHash (BCrypt)
- Role (Admin=3, Instructor=2, Student=1)
- StudentNumber, Department, PhoneNumber
- CreatedAt, UpdatedAt, IsDeleted
```

#### **Courses**
```sql
- Id (PK)
- CourseCode (CS101), CourseName
- Description, Department
- CreditHours, AcademicYear
- CreatedAt, UpdatedAt, IsDeleted
```

#### **Classes**
```sql
- Id (PK)
- ClassName, ClassCode
- CourseId (FK), InstructorId (FK)
- MaxCapacity, CurrentEnrollment
- Semester
- CreatedAt, UpdatedAt, IsDeleted
```

#### **ClassSchedules** ?
```sql
- Id (PK)
- ClassId (FK)
- DayOfWeek (0=Sunday...6=Saturday)
- StartTime, EndTime (TimeSpan)
- RoomNumber, Building
- Notes, IsActive
- CreatedAt, UpdatedAt, IsDeleted
```

#### **Assignments**
```sql
- Id (PK)
- Title, Description
- ClassId (FK), Type (1=Individual, 2=Group)
- DueDate, MaxScore
- AllowLateSubmission, AllowResubmission
- AttachmentPath
- CreatedAt, UpdatedAt, IsDeleted
```

#### **AssignmentGroups** ?
```sql
- Id (PK)
- AssignmentId (FK)
- GroupName
- CreatedAt, UpdatedAt, IsDeleted
```

#### **GroupMembers** ?
```sql
- Id (PK)
- GroupId (FK), StudentId (FK)
- IsLeader (boolean)
- CreatedAt, UpdatedAt, IsDeleted
```

#### **Submissions**
```sql
- Id (PK)
- AssignmentId (FK), StudentId (FK)
- GroupId (FK, nullable for group submissions)
- FilePath, FileType, FileSizeInBytes
- Comments, SubmittedAt
- IsLate, Status
- CreatedAt, UpdatedAt, IsDeleted
```

#### **Grades**
```sql
- Id (PK)
- SubmissionId (FK), InstructorId (FK)
- Score (decimal), Feedback
- GradedAt, IsPublished
- CreatedAt, UpdatedAt, IsDeleted
```

#### **Enrollments**
```sql
- Id (PK)
- StudentId (FK), ClassId (FK)
- EnrollmentDate, IsActive
- CreatedAt, UpdatedAt, IsDeleted
```

#### **Notifications** ?
```sql
- Id (PK)
- UserId (FK)
- Title, Message
- Type, IsRead
- CreatedAt, UpdatedAt, IsDeleted
```

#### **CourseInstructors** ?
```sql
- Id (PK)
- CourseId (FK), InstructorId (FK)
- AcademicYear, IsActive
- CreatedAt, UpdatedAt, IsDeleted
```

---

## ?? Security Features

- **JWT Authentication**: Stateless token-based auth
- **Role-based Authorization**: Admin/Instructor/Student permissions
- **Password Security**: BCrypt hashing
- **CORS Support**: Cross-origin request handling
- **Input Validation**: FluentValidation on all DTOs
- **File Upload Security**: Type and size restrictions

---

## ?? Advanced Features

### **Group Management System** ?
- Student-initiated group formation
- Automatic leadership assignment (first member = leader)
- Leader-only submission rights
- Group member management

### **Schedule Management System** ?
- Time/room conflict detection
- Template-based schedule creation (MWF, T-Th patterns)
- Multi-index optimization for performance
- Instructor and room scheduling

### **Bulk Operations**
- Mass user import via CSV
- Batch enrollment management
- Template-based schedule creation

### **Dashboard & Analytics**
- Role-specific dashboards
- Real-time statistics
- Performance metrics
- System health monitoring

### **File Management**
- Secure file upload/download
- Multiple format support (PDF, JPG, PNG)
- Size and type validation
- Organized storage structure

---

## ?? Performance Optimizations

- **Database Indexing**: Strategic index placement
- **Query Filtering**: Global query filters for soft deletes
- **Lazy Loading**: Efficient data retrieval
- **Caching Ready**: Prepared for Redis integration
- **Pagination Support**: Large dataset handling

---

## ?? System Status: **PRODUCTION READY** ??

**Total API Endpoints**: **70+**
**Database Tables**: **12** core entities
**Authentication**: **JWT Bearer Tokens**
**File Storage**: **Local with validation**
**Testing**: **Comprehensive Postman collections**

---

*Generated on: January 9, 2025*
*AMS Version: 1.0.0*
*Framework: .NET 9.0*