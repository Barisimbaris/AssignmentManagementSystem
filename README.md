@"

\# 🎓 Assignment Management System (AMS) API



A comprehensive RESTful API for managing academic assignments, submissions, and grading built with .NET 9 and Clean Architecture.



\## 🌟 Features



\### 👤 Authentication \& Authorization

\- JWT-based authentication

\- Role-based authorization (Student, Instructor, Admin)

\- Secure password hashing with BCrypt

\- Token expiration and refresh



\### 📚 Core Functionality

\- \*\*User Management\*\*: CRUD operations for students, instructors, and admins

\- \*\*Course Management\*\*: Create and manage academic courses

\- \*\*Class Management\*\*: Manage class sections with student enrollment

\- \*\*Assignment Management\*\*: Create individual/group assignments with due dates

\- \*\*Submission Management\*\*: File upload/download for assignment submissions

\- \*\*Grade Management\*\*: Grade submissions with feedback and publish results



\### 📁 File Management

\- Secure file upload (PDF, JPG, PNG)

\- File validation (type and size)

\- File download endpoint

\- Automatic file organization by assignment and student



---



\## 🏗️ Architecture



\### Clean Architecture (4 Layers)

\\`\\`\\`

┌─────────────────────────────────────┐

│         AMS.API (Presentation)      │

│   Controllers, Middleware, Swagger  │

└─────────────────────────────────────┘

&nbsp;                 ↓

┌─────────────────────────────────────┐

│      AMS.Application (Business)     │

│   Services, DTOs, Validators        │

└─────────────────────────────────────┘

&nbsp;                 ↓

┌─────────────────────────────────────┐

│         AMS.Domain (Core)           │

│   Entities, Enums, Interfaces       │

└─────────────────────────────────────┘

&nbsp;                 ↓

┌─────────────────────────────────────┐

│   AMS.Infrastructure (Data Access)  │

│   EF Core, Repositories, Migrations │

└─────────────────────────────────────┘

\\`\\`\\`



---



\## 🛠️ Technologies



\- \*\*.NET 9\*\* - Framework

\- \*\*ASP.NET Core Web API\*\* - REST API

\- \*\*Entity Framework Core 8\*\* - ORM

\- \*\*SQL Server\*\* - Database

\- \*\*JWT\*\* - Authentication

\- \*\*FluentValidation\*\* - Input validation

\- \*\*Swagger/OpenAPI\*\* - API documentation

\- \*\*BCrypt\*\* - Password hashing



---



\## 📋 Prerequisites



\- .NET 9 SDK

\- SQL Server (LocalDB or full version)

\- Visual Studio 2022 / VS Code / Rider



---



\## 🚀 Getting Started



\### 1. Clone the repository

\\`\\`\\`bash

git clone https://github.com/Barisimbaris/AssignmentManagementSystem.git

cd AssignmentManagementSystem

\\`\\`\\`



\### 2. Update Database Connection String

Edit \\`src/AMS.API/appsettings.json\\`:

\\`\\`\\`json

{

&nbsp; \\"ConnectionStrings\\": {

&nbsp;   \\"DefaultConnection\\": \\"Server=localhost;Database=AssignmentManagementDB;Trusted\_Connection=True;TrustServerCertificate=True\\"

&nbsp; }

}

\\`\\`\\`



\### 3. Run Migrations

\\`\\`\\`bash

dotnet ef database update --project src/AMS.Infrastructure --startup-project src/AMS.API

\\`\\`\\`



\### 4. Run the API

\\`\\`\\`bash

dotnet run --project src/AMS.API/AMS.API.csproj

\\`\\`\\`



\### 5. Access Swagger UI

Open browser: \\`https://localhost:7097/swagger\\`



---



\## 🔑 API Endpoints



\### Authentication

| Method | Endpoint | Description | Auth Required |

|--------|----------|-------------|---------------|

| POST | \\`/api/Auth/register\\` | Register new user | ❌ |

| POST | \\`/api/Auth/login\\` | Login and get JWT token | ❌ |

| POST | \\`/api/Auth/change-password\\` | Change password | ✅ |



\### Users

| Method | Endpoint | Description | Auth Required | Role |

|--------|----------|-------------|---------------|------|

| GET | \\`/api/User/{id}\\` | Get user by ID | ✅ | All |

| GET | \\`/api/User/me\\` | Get current user | ✅ | All |

| GET | \\`/api/User/students\\` | Get all students | ✅ | All |

| GET | \\`/api/User/instructors\\` | Get all instructors | ✅ | All |

| PUT | \\`/api/User/{id}\\` | Update user | ✅ | Owner/Admin |

| DELETE | \\`/api/User/{id}\\` | Delete user | ✅ | Admin |



\### Courses

| Method | Endpoint | Description | Auth Required | Role |

|--------|----------|-------------|---------------|------|

| GET | \\`/api/Course\\` | Get all courses | ✅ | All |

| GET | \\`/api/Course/{id}\\` | Get course by ID | ✅ | All |

| POST | \\`/api/Course\\` | Create course | ✅ | Admin |

| PUT | \\`/api/Course/{id}\\` | Update course | ✅ | Admin |

| DELETE | \\`/api/Course/{id}\\` | Delete course | ✅ | Admin |



\### Classes

| Method | Endpoint | Description | Auth Required | Role |

|--------|----------|-------------|---------------|------|

| GET | \\`/api/Class\\` | Get all classes | ✅ | All |

| GET | \\`/api/Class/{id}\\` | Get class by ID | ✅ | All |

| GET | \\`/api/Class/my-classes\\` | Get instructor's classes | ✅ | Instructor/Admin |

| POST | \\`/api/Class\\` | Create class | ✅ | Instructor/Admin |

| POST | \\`/api/Class/{id}/enroll\\` | Enroll in class | ✅ | Student |

| POST | \\`/api/Class/{id}/unenroll\\` | Unenroll from class | ✅ | Student |

| PUT | \\`/api/Class/{id}\\` | Update class | ✅ | Instructor/Admin |

| DELETE | \\`/api/Class/{id}\\` | Delete class | ✅ | Admin |



\### Assignments

| Method | Endpoint | Description | Auth Required | Role |

|--------|----------|-------------|---------------|------|

| GET | \\`/api/Assignment\\` | Get all assignments | ✅ | All |

| GET | \\`/api/Assignment/{id}\\` | Get assignment by ID | ✅ | All |

| GET | \\`/api/Assignment/my-assignments\\` | Get student's assignments | ✅ | Student |

| POST | \\`/api/Assignment\\` | Create assignment | ✅ | Instructor/Admin |

| PUT | \\`/api/Assignment/{id}\\` | Update assignment | ✅ | Instructor/Admin |

| DELETE | \\`/api/Assignment/{id}\\` | Delete assignment | ✅ | Instructor/Admin |



\### Submissions

| Method | Endpoint | Description | Auth Required | Role |

|--------|----------|-------------|---------------|------|

| GET | \\`/api/Submission/{id}\\` | Get submission by ID | ✅ | All |

| GET | \\`/api/Submission/my-submissions\\` | Get student's submissions | ✅ | Student |

| GET | \\`/api/Submission/{id}/download\\` | Download submission file | ✅ | All |

| POST | \\`/api/Submission\\` | Submit assignment (with file) | ✅ | Student |

| PUT | \\`/api/Submission/{id}/resubmit\\` | Resubmit assignment | ✅ | Student |

| DELETE | \\`/api/Submission/{id}\\` | Delete submission | ✅ | Student |



\### Grades

| Method | Endpoint | Description | Auth Required | Role |

|--------|----------|-------------|---------------|------|

| GET | \\`/api/Grade/{id}\\` | Get grade by ID | ✅ | All |

| GET | \\`/api/Grade/my-grades\\` | Get student's grades | ✅ | Student |

| GET | \\`/api/Grade/class/{classId}\\` | Get grades by class | ✅ | Instructor/Admin |

| POST | \\`/api/Grade\\` | Create grade | ✅ | Instructor/Admin |

| POST | \\`/api/Grade/publish\\` | Publish grades | ✅ | Instructor/Admin |

| PUT | \\`/api/Grade/{id}\\` | Update grade | ✅ | Instructor/Admin |

| DELETE | \\`/api/Grade/{id}\\` | Delete grade | ✅ | Instructor/Admin |



---



\## 🔐 Authentication



\### 1. Register

\\`\\`\\`bash

POST /api/Auth/register

Content-Type: application/json



{

&nbsp; \\"firstName\\": \\"John\\",

&nbsp; \\"lastName\\": \\"Doe\\",

&nbsp; \\"email\\": \\"john@example.com\\",

&nbsp; \\"password\\": \\"Password123\\",

&nbsp; \\"confirmPassword\\": \\"Password123\\",

&nbsp; \\"role\\": 1,

&nbsp; \\"department\\": \\"Computer Science\\"

}

\\`\\`\\`



\*\*Roles:\*\*

\- \\`1\\` = Student

\- \\`2\\` = Instructor

\- \\`3\\` = Admin



\### 2. Login

\\`\\`\\`bash

POST /api/Auth/login

Content-Type: application/json



{

&nbsp; \\"email\\": \\"john@example.com\\",

&nbsp; \\"password\\": \\"Password123\\"

}

\\`\\`\\`



\*\*Response:\*\*

\\`\\`\\`json

{

&nbsp; \\"data\\": {

&nbsp;   \\"token\\": \\"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\\",

&nbsp;   \\"expiresAt\\": \\"2025-11-25T20:00:00Z\\"

&nbsp; }

}

\\`\\`\\`



\### 3. Use Token

Add to request headers:

\\`\\`\\`

Authorization: Bearer {token}

\\`\\`\\`



---



\## 📤 File Upload



\### Submit Assignment with File

\\`\\`\\`bash

POST /api/Submission

Content-Type: multipart/form-data

Authorization: Bearer {token}



assignmentId: 1

comments: My solution

file: \[select PDF/JPG/PNG file]

\\`\\`\\`



\*\*File Restrictions:\*\*

\- Allowed types: PDF, JPG, JPEG, PNG

\- Maximum size: 10 MB



---



\## 🗄️ Database Schema



\### Main Entities

\- \*\*User\*\* - Students, Instructors, Admins

\- \*\*Course\*\* - Academic courses

\- \*\*Class\*\* - Course sections

\- \*\*Enrollment\*\* - Student-Class relationship

\- \*\*Assignment\*\* - Individual or group assignments

\- \*\*Submission\*\* - Assignment submissions with files

\- \*\*Grade\*\* - Grades and feedback

\- \*\*Group\*\* - Student groups for assignments



---



\## 🔧 Configuration



\### JWT Settings (appsettings.json)

\\`\\`\\`json

{

&nbsp; \\"JwtSettings\\": {

&nbsp;   \\"SecretKey\\": \\"YourSecretKeyHere\\",

&nbsp;   \\"Issuer\\": \\"AMS.API\\",

&nbsp;   \\"Audience\\": \\"AMS.Client\\",

&nbsp;   \\"ExpirationInMinutes\\": 1440

&nbsp; }

}

\\`\\`\\`



\### CORS Settings

Currently configured to allow all origins for development.

For production, update \\`Program.cs\\`:

\\`\\`\\`csharp

builder.WithOrigins(\\"https://yourdomain.com\\")

\\`\\`\\`



---



\## 📱 Mobile \& Web Support



This API is designed to work with:

\- ✅ \*\*Mobile Apps\*\* (iOS, Android, React Native, Flutter)

\- ✅ \*\*Web Apps\*\* (React, Angular, Vue, Blazor)

\- ✅ \*\*Desktop Apps\*\* (WPF, Electron)



\*\*CORS is enabled\*\* for cross-origin requests.



---



\## 👥 Team



\- \*\*Backend API\*\*: \[@Barisimbaris](https://github.com/Barisimbaris)

\- \*\*Mobile App\*\*: \[@Barisimbaris](https://github.com/Barisimbaris)

\- \*\*Web App\*\*: \[@AhmetDoganAltay](https://github.com/yourusername) (teammate)



---



\## 📄 License



This project is for educational purposes.



---



\## 🤝 Contributing



1\. Fork the repository

2\. Create feature branch (\\`git checkout -b feature/AmazingFeature\\`)

3\. Commit changes (\\`git commit -m 'Add AmazingFeature'\\`)

4\. Push to branch (\\`git push origin feature/AmazingFeature\\`)

5\. Open Pull Request



---



\## 📞 Support



For questions or issues, please open an issue on GitHub.

"@ | Out-File -FilePath README.md -Encoding UTF8

