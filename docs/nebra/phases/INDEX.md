# NEBRA — Implementation Phases V3

هذه النسخة هي الخطة المعتمدة حالياً لمشروع NEBRA.

## قرارات Scope الحالية

### موجود ضمن المشروع

- Platform Admin Dashboard
- School Management
- Institute Management
- Roles + Permissions + Scope
- Students / Parents / Teachers / Supervisors / Administrative Staff / Accountant
- Academic Years / Grades / Sections
- Institute Subjects / Groups / Enrollments
- Attendance
- Homework
- Academic Exams
- Excel Grade Import
- Student / Parent notifications
- Courses
- Units / Lessons / Resources
- Public Courses
- Institution Courses
- Independent Instructor Courses
- AI Assistant
- Student / Parent App
- Finance
- Invitations
- Push / WhatsApp
- Official Results
- High-Traffic Results Architecture

### ملغى من الخطة

```text
Automated Quizzes
Question Bank
Auto Correction
Quiz Attempts
Quiz Analytics
Quiz Builder
```

هذه الميزات ليست ضمن الـMVP وليست ضمن الخطة المستقبلية الحالية.

---

## AI والكورسات

### AI Assistant

الـAI يبقى جزءاً أساسياً من تجربة الطالب.

```text
Student
→ NEBRA AI
→ General Study Help
→ Explain Lessons
→ Explain Course Content
```

### Public Courses

الكورسات العامة مرتبطة باشتراك NEBRA فعال يمنح Public Courses Access.

```text
Public Course
→ Subscription Check
→ Available when entitled
```

### AI Assistant

استخدام الـAI مرتبط باشتراك NEBRA فعال يمنح AI Access.

### Subscription System

```text
IN SCOPE
```

الاشتراكات تتحكم حالياً فقط بالوصول إلى:

- AI Assistant.
- Public Courses.

وتبقى منفصلة عن Finance المدرسة/المعهد.

تفاصيل الأسعار، الباقات، الدفع والتجديد تبقى Open Questions حتى يتم اعتمادها.

---

## Course Sources

```text
Course
├── PLATFORM
├── INSTITUTION
└── INSTRUCTOR
```

### PLATFORM
كورسات عامة يضيفها Platform Admin.

### INSTITUTION
كورسات تضيفها مدرسة أو معهد، ويمكن استهداف طلاب محددين أو صف/شعبة/مادة/مجموعة.

### INSTRUCTOR
كورسات يضيفها مدرس خصوصي / Instructor مستقل تمت إضافته من صاحب المنصة.

---

## ترتيب التنفيذ

1. Phase 1 — Foundation & Architecture
2. Phase 2 — Identity, Institutions, Roles & Permissions
3. Phase 3 — School & Institute Academic Structure
4. Phase 4 — Daily Academic Operations
5. Phase 5 — Courses, AI & Instructor Platform
6. Phase 6 — Student & Parent App
7. Phase 7 — Finance
8. Phase 8 — Invitations, Notifications & WhatsApp
9. Phase 9 — Official Results & High Scale

---

## الاستفادة من Quizy

نستفيد فقط من الأجزاء التي تخدم Scope الحالي:

```text
Auth patterns
Subjects
Units
Lessons
Courses
Course Downloads
AI Chat
Student Learning UX
Content Management
```

ولا ننقل:

```text
Quizzes
Questions
Answers
Attempts
Auto-Grading
Quiz Analytics
Quiz Builder
Subscription access logic for AI/Public Courses
```
