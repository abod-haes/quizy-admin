# Phase 2 — Identity, Institutions, Roles & Permissions

## الهدف
بناء قلب المنصة: الحسابات، المؤسسات، الأدوار، الصلاحيات والـScope.

## المؤسسات
- School.
- Institute.
- Platform Admin يدير المؤسسات ويضيف/يعدل/يفعل/يعطل.

## الأدوار
### Platform
- PLATFORM_ADMIN

### School
- SCHOOL_DIRECTOR
- ADMINISTRATIVE_STAFF
- SUPERVISOR
- TEACHER
- ACCOUNTANT / FINANCE_STAFF

### Institute
- INSTITUTE_DIRECTOR
- ADMINISTRATIVE_STAFF
- TEACHER
- ACCOUNTANT

### External
- STUDENT
- PARENT
- INSTRUCTOR

## Permission Model
`Role + Permission + Scope`

### Teacher Scope
- Assigned Subjects
- Assigned Sections / Groups

### Supervisor Scope
- Assigned Grades
- Assigned Sections

### Administrative Staff
- Entire Institution

### Director
- Entire Institution

## Profiles
- StudentProfile
- StudentRecord
- ParentProfile
- TeacherProfile
- StaffProfile
- InstructorProfile

## Audit
تسجيل العمليات الحساسة ومن قام بها.

## Deliverables
- Auth.
- Institutions.
- Roles.
- Permissions.
- Scopes.
- User/Profile model.
- Platform Admin foundation.
- Audit foundation.
