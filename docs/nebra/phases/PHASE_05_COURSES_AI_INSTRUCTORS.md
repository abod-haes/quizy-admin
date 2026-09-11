# Phase 5 — Courses, AI & Instructor Platform

## الهدف

بناء Learning Layer أساسية في NEBRA تعتمد على الكورسات والدروس والموارد والـAI فقط.

الاختبارات المؤتمتة ليست ضمن الـScope الحالي. نظام الاشتراكات جزء من هذه المرحلة لأنه يتحكم بالـAI والكورسات العامة.

---

## 1. Quizy Reuse

نستفيد من Quizy في:

```text
Subjects
Units
Lessons
Courses
Course Downloads
AI Chat
Student Learning UX
Content Management
```

ولا يتم نقل:

```text
Quizzes
Question Bank
Questions
Answers
Attempts
Auto Correction
Quiz Analytics
Legacy/old subscription logic يتم مراجعته قبل إعادة الاستخدام
```

---

## 2. Course Sources

الكورس يمكن أن يأتي من:

```text
PLATFORM
INSTITUTION
INSTRUCTOR
```

---

## 3. Platform Courses

مدير NEBRA يستطيع إضافة كورسات عامة.

```text
Platform Admin
→ Create Course
→ Publish
→ Available to Students
```

الكورس العام يحتاج Subscription فعال يمنح Public Courses Access.

---

## 4. Institution Courses

المدرسة أو المعهد يستطيعان إضافة كورسات.

يمكن استهداف:

```text
Grade
Section
Subject
Group
Specific Students
```

---

## 5. Independent Instructor Courses

صاحب المنصة يستطيع إضافة Instructor مستقل.

```text
Platform Admin
→ Add Instructor
→ Instructor Account
→ Instructor Creates Courses
```

المدرس الخصوصي مستقل عن المدرسة أو المعهد.

---

## 6. Course Visibility

```text
PUBLIC
PRIVATE
TARGETED
```

### PUBLIC

متاح للطلاب الذين يملكون Public Courses Access ضمن Subscription فعال.

### PRIVATE

خاص بجهة محددة.

### TARGETED

موجه إلى:

```text
Grade
Section
Subject
Group
Specific Students
```

---

## 7. Course Structure

```text
Course
├── Title
├── Description
├── Instructor / Owner
├── Units
├── Lessons
├── Files
├── Videos / Resources
└── Visibility / Target
```

---

## 8. Independent Student

الطالب غير المرتبط بمؤسسة يستطيع استخدام:

```text
Public Courses
Instructor Public Courses
AI Assistant
```

حسب Subscription Access المطلوب.

---

## 9. Institution Student

الطالب المرتبط بمؤسسة يستطيع رؤية:

```text
Institution Courses
+
Public Platform Courses
+
Public Instructor Courses
```

حسب الـTarget والـVisibility.

---

## 10. AI Assistant

الـAI يبقى Core Feature.

```text
NEBRA AI
├── General Study Help
├── Explain Lesson
├── Explain Course Content
└── Student Questions
```

يمكن أن يعمل مع Context:

```text
Subject
Course
Lesson
```

---

## 11. Subscription System

نظام الاشتراكات موجود ضمن Scope الحالي.

```text
Subscriptions = IN SCOPE
```

الاستخدام الحالي:

```text
Subscription
├── AI Access
└── Public Courses Access
```

قواعد:
- AI يتطلب اشتراكاً فعالاً يمنح AI Access.
- PUBLIC Courses تتطلب اشتراكاً فعالاً يمنح Public Courses Access.
- Institution PRIVATE/TARGETED Courses تعتمد على Membership/Targeting وليست على اشتراك الكورسات العامة.
- تفاصيل الأسعار والدفع والتجديد تبقى Open Questions.
- لا يتم افتراض Payment Provider قبل اعتماده.

---

## Deliverables

- Course management.
- Units.
- Lessons.
- Resources.
- Downloads.
- Public platform courses.
- Institution courses.
- Independent instructor courses.
- Course targeting.
- Instructor accounts.
- AI assistant.
- Subscription access for AI/Public Courses.
- Quizy course/AI reuse.
- NEBRA learning UI.
