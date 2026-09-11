# Product Requirements Document

## 1. Project Overview

**NEBRA** منصة SaaS تعليمية متعددة المؤسسات لإدارة المدارس والمعاهد وربط الإدارة والمدرسين والموجهين والمحاسبين والطلاب وأولياء الأمور ضمن نظام واحد.

واجهات المنتج المؤكدة:

1. **NEBRA Platform Admin Dashboard**
2. **Institution Management Web**
3. **Institution Management App**
4. **NEBRA Mobile App** بنمطين:
   - Student Mode
   - Parent Mode

الـBackend هو مصدر الحقيقة الوحيد لجميع الواجهات.

### Current Scope Decisions

**Included**
- مدارس ومعاهد.
- Multi-Tenancy.
- Roles + Permissions + Scope.
- الطلاب والأهل والمدرسون والموجهون والإداريون والمدير والمحاسب.
- الحضور.
- الواجبات.
- الامتحانات الأكاديمية والعلامات.
- رفع العلامات من Excel.
- الكورسات والدروس والموارد.
- كورسات عامة من المنصة.
- كورسات المؤسسة.
- مدرسون مستقلون/Instructors وكورساتهم.
- AI Assistant للطالب.
- Finance للمؤسسة والطالب والأهل.
- Invitations + Notifications + Push + WhatsApp.
- نتائج رسمية مثل التاسع والبكالوريا مع تصميم قابل للتوسع.

**Explicitly Out of Scope**
- Automated Quizzes.
- Question Bank.
- Quiz Builder.
- Auto Correction.
- Quiz Attempts.
- Quiz Analytics.
- Subscription System.
- Subscription-gated AI.
- Subscription-gated Public Courses.

---

## 2. Project Goals

1. إدارة المدرسة والمعهد من نفس المنصة مع الحفاظ على اختلاف Business Rules.
2. إعطاء كل مؤسسة بيانات معزولة بالكامل عن المؤسسات الأخرى.
3. بناء ملف طالب موحد 360° يربط الأكاديمي والحضور والعلامات والكورسات والمال والتواصل.
4. تمكين الطالب من استخدام NEBRA بشكل مستقل حتى بدون مؤسسة.
5. تمكين المؤسسة من دعوة الطالب وربط حسابه الموجود أو إنشاء حساب جديد بعد التحقق.
6. تمكين المدرس من إدارة واجبات وعلامات ضمن Scope محدد.
7. تمكين الموجه من الإشراف على مجموعة صفوف/شعب فقط.
8. تمكين الإداري والمدير من العمل على نطاق المؤسسة المناسب.
9. تمكين المعهد/المدرسة والمدرس المستقل والمنصة من نشر كورسات وفق قواعد Visibility/Targeting.
10. توفير AI Assistant كميزة أساسية للطالب بدون اشتراك.
11. إدارة الرسوم والدفعات وإظهار المتبقي وسجل الدفع للأهل.
12. توفير مسار نتائج رسمية قابل لتحمل ضغط مرتفع.

---

## 3. Target Users

| Actor | Scope | Main Purpose |
|---|---|---|
| Platform Admin | كل منصة NEBRA | إدارة المؤسسات والمدرسين المستقلين والكورسات العامة |
| School Director | مدرسة واحدة | إدارة كاملة للمؤسسة ضمن الصلاحيات |
| Institute Director | معهد واحد | إدارة كاملة للمؤسسة ضمن الصلاحيات |
| Administrative Staff | كامل المؤسسة | إدارة الطلاب والبنية والعمليات المسموحة |
| Supervisor / موجه | صفوف/شعب محددة | الإشراف الأكاديمي ضمن Scope |
| Teacher | مواد/شعب/مجموعات محددة | حضور، واجبات، امتحانات/علامات حسب الصلاحية |
| Accountant | المؤسسة | رسوم، دفعات، أرصدة، تقارير |
| Independent Instructor | منصة NEBRA | إضافة وإدارة كورساته |
| Student | عالمي + Memberships | تعلم، AI، متابعة المؤسسة، النتائج |
| Parent | أطفال مرتبطون فقط | متابعة العلامات والحضور والمال والإشعارات |

---

## 4. Business Context

### School

```text
Student Record
→ Academic Year
→ Grade
→ Section
→ School curriculum
```

### Institute

```text
Student Record
├── Subject Enrollment → Group A
├── Subject Enrollment → Group B
└── Subject Enrollment → Group C
```

قاعدة أساسية:

```text
Student Account != Student Record != Enrollment
```

### Independent Student

الطالب يمكن أن يملك حساب NEBRA بدون Institution Membership، ويستخدم:
- Public Courses.
- Public Instructor Courses.
- AI Assistant.
- Official Results عند توفرها.

### Learning Model

```text
Course Source
├── PLATFORM
├── INSTITUTION
└── INSTRUCTOR
```

لا يوجد Subscription System حالياً.

---

## 5. Core Features

### 5.1 Platform Administration
- إضافة مدرسة/معهد.
- تعديل بيانات المؤسسة.
- تفعيل/تعطيل المؤسسة.
- عرض المؤسسات.
- إضافة Independent Instructor.
- إدارة Platform Public Courses.

### 5.2 Identity, Roles and Scope
- حساب موحد.
- Role/Permission model.
- Institution membership.
- Teacher assignments.
- Supervisor scopes.
- Parent/student access restrictions.

### 5.3 Student Management
- إنشاء Student Record.
- البحث والتعديل والأرشفة.
- Excel bulk import.
- ربط ولي الأمر.
- ربط حساب الطالب عبر Invitation.
- School/Institute enrollment.

### 5.4 Academic Structure
- Academic Years.
- Grades.
- Sections.
- Subjects.
- Institute Groups.
- Teacher assignments.
- Supervisor scopes.

### 5.5 Attendance
- Present / Absent / Late / Excused.
- تسجيل ضمن Scope.
- إشعارات غياب حسب سياسة التواصل.

### 5.6 Homework
- إنشاء واجب.
- مادة وتاريخ استحقاق وملفات.
- Target: Grade / Section / Subject / Group / Specific Students.

### 5.7 Academic Exams and Grades
الامتحان الأكاديمي هو سجل رسمي تابع لمادة ولا يحتوي Question Bank.

Flow:
```text
Create Exam
→ Grade or Section
→ Download Excel Template
→ Fill Student Scores
→ Upload
→ Validate
→ Preview
→ Save Draft
→ Publish
→ Notify Students
→ Optional Parent Notification
```

### 5.8 Courses
- Platform Public Courses.
- Institution Courses.
- Instructor Courses.
- Units / Lessons / Resources / Downloads.
- Visibility: PUBLIC / PRIVATE / TARGETED.
- Targeting للمؤسسة: Grade / Section / Subject / Group / Specific Students.
- الكورسات العامة تخضع لاشتراك NEBRA فعال يسمح بالوصول إلى Public Courses.
- كورسات المؤسسة الموجهة لطلابها تعتمد على Membership/Targeting وليست جزءاً من اشتراك الكورسات العامة.

### 5.9 AI Assistant
- General study help.
- Explain lesson.
- Explain course content.
- Course/Lesson context.
- الوصول إلى الـAI يتطلب Subscription فعال يسمح باستخدام AI.

### 5.10 Platform Subscriptions
- يوجد Subscription System على مستوى NEBRA.
- الاشتراك يتحكم حالياً بالوصول إلى:
  - AI Assistant.
  - Public Courses.
- يمكن للخطة أن تمنح AI access أو Public Courses access أو الاثنين معاً.
- تفاصيل الباقات والأسعار وطريقة الدفع ليست مثبتة بعد ويجب ألا يتم افتراضها.
- اشتراكات NEBRA منفصلة عن رسوم المدرسة/المعهد في Finance.

### 5.11 Parent Experience
- My Children.
- Attendance.
- Official Grades.
- Academic Exams.
- Homework.
- Courses.
- Finance.
- Announcements/Notifications.

### 5.12 Finance
- Charges.
- Payments.
- Discounts.
- Refunds.
- Calculated Balance.
- Parent payment history.
- Accountant workflows.

### 5.13 Invitations and Communication
- Student invitation.
- Parent invitation.
- Phone verification / secure activation.
- In-App.
- Push.
- Optional WhatsApp.
- Queue-based delivery for bulk notifications.

### 5.14 Official Results
- Ninth Grade / Baccalaureate result types.
- Independent student access.
- Precomputed read snapshots.
- Cache.
- Rate limiting.
- Scale-out readiness.

---

## 6. User Flows

### Institution Adds Student
```text
Staff creates Student Record
→ optional parent data
→ phone number
→ invitation
→ existing account? link after acceptance
→ otherwise verify phone and create account
```

### Teacher Publishes Exam Grades
```text
Create academic exam
→ select subject + grade/section
→ upload Excel
→ validate/preview
→ draft
→ publish
→ student notified
→ parent notified only when selected
```

### Institute Enrollment
```text
Student Record
→ choose Subject
→ choose Group
→ create Enrollment
```

### Course Publishing
```text
Platform / Institution / Instructor
→ create Course
→ add units/lessons/resources
→ set visibility/target
→ publish
→ eligible students request access
→ PUBLIC course: verify active Public Courses subscription
→ Institution TARGETED course: verify membership/target
→ show course
```

### Payment
```text
Accountant
→ student finance
→ record payment
→ balance recalculated
→ audit recorded
→ parent sees updated history
```

---

## 7. Functional Requirements

### FR-01 Tenant Isolation
Every institution-scoped request must resolve the authenticated user's institution access on the server.

**Acceptance**
Given a user from Institution A  
When requesting a resource owned by Institution B  
Then access is denied and no B data is returned.

### FR-02 Supervisor Scope
Supervisor access is limited to assigned grades/sections.

### FR-03 Administrative Scope
Administrative Staff can operate across the institution subject to permissions.

### FR-04 Teacher Scope
Teacher access is limited to assigned subjects/sections/groups.

### FR-05 Academic Exam Import
Excel grades must be validated before persistence/publish.

### FR-06 Publish Notifications
Students receive an in-app notification on grade publish when linked to an account. Parent notification is controlled separately.

### FR-07 Subscription-Gated Public Learning
Public Courses and AI require a valid active NEBRA subscription with the corresponding access entitlement.

**Acceptance**
Given a student without valid Public Courses access  
When requesting a PUBLIC course  
Then course content access is denied.

Given a student with valid Public Courses access  
When requesting an eligible PUBLIC course  
Then course content is returned.

Given a student without valid AI access  
When sending an AI request  
Then the request is rejected with a subscription-required response.

Given a student targeted by an Institution Course  
When requesting that institution course  
Then access is decided by institution membership/targeting, not by the Public Courses subscription.

### FR-08 Finance Balance
Balance is derived from financial transactions; it is not manually edited as source of truth.

---

## 8. Non-Functional Requirements

- Strong tenant isolation.
- Server-side authorization.
- PostgreSQL transactional integrity.
- API validation.
- Auditability for grades, finance, permissions and student changes.
- Mobile/web clients share backend rules.
- Queue bulk communication.
- Cache only where justified.
- Official-result read path must support high traffic.
- Stateless APIs where practical.

---

## 9. Business Rules

1. Platform Admin is separate from Institution Director.
2. A Student Record may exist before a NEBRA user account.
3. Phone matching alone must not auto-link accounts without verification/acceptance.
4. School enrollment and institute enrollment are different flows.
5. Institute student can have multiple subject enrollments.
6. Academic Exam is not an automated quiz.
7. Academic Exam belongs to one Subject and targets a Grade or Section; institute adaptation to Group is allowed only when explicitly configured in its academic flow.
8. Grade upload supports Draft before Publish.
9. Student notification on Publish and Parent notification are separate decisions.
10. Public Courses and AI are protected by NEBRA subscription access.
11. Subscription access must be validated server-side.
12. Institution-targeted courses are governed by institution membership/targeting and are separate from Public Courses subscription.
13. Institution course visibility follows target rules.
14. Parent can access only linked children.
15. Financial balance is computed from transactions.
16. Sensitive records should be archived/soft-deleted rather than destructively removed.

---

## 10. Out of Scope

- Automated quiz engine.
- Question Bank.
- Auto correction.
- Quiz analytics.
- Automated subscription payment provider/integration until a provider is approved.
- Detailed pricing/package rules until business decisions are finalized.
- HR/payroll.
- Transport/GPS.
- Online admission.
- Behavior module.
- Advanced AI analytics.
- Online course payment/e-commerce unless separately approved.

---

## 11. Open Questions

1. هل الطالب يستطيع الانتماء لعدة مدارس/معاهد بنفس الوقت بدون قيود؟
2. هل `visibleToParent=false` مطلوب فعلياً أم فقط `notifyParent=false`؟
3. أنواع الامتحانات الرسمية وقواعد المتوسط/الأوزان.
4. هل المعهد ينشئ Academic Exam على Group مباشرة أم فقط Subject/Group enrollment context؟
5. تفاصيل الرسوم: سنوية/شهرية/دفعات/تقسيط.
6. آلية توزيع Payment على Charges.
7. العملات المطلوبة.
8. سياسة Refund/Discount التفصيلية.
9. مزود WhatsApp النهائي.
10. مزود AI الحالي/النهائي وحدود الاستخدام.
11. مصدر النتائج الرسمية للتاسع والبكالوريا وقواعد الخصوصية.
12. هل بعض Instructor Courses تكون Private/Targeted خارج مؤسسة؟ التفاصيل تحتاج تثبيت.


### Subscription Open Questions

1. هل AI والكورسات العامة ضمن اشتراك واحد أم يمكن أن تكون باقات منفصلة؟
2. ما أسماء الباقات ومددها وأسعارها؟
3. ما طريقة شراء/تفعيل الاشتراك: دفع إلكتروني، كود، تفعيل إداري، أم أكثر من طريقة؟
4. هل توجد فترة سماح بعد انتهاء الاشتراك؟
5. هل كل Instructor PUBLIC Course يدخل تلقائياً ضمن اشتراك الكورسات العامة أم يستطيع صاحب المنصة تحديد ذلك؟
6. هل يوجد Trial مجاني؟ غير مؤكد حالياً.
