# Phase 1 — Product Foundation & Architecture

## الهدف
تثبيت معمارية NEBRA وحدود الـDomains قبل بناء الميزات.

## الأعمال
- تثبيت قاعدة: `User Account != Student Record != Enrollment`.
- تثبيت `SCHOOL` و`INSTITUTE`.
- الطالب يمكن أن يكون Independent أو مرتبطاً بمؤسسة.
- اعتماد NestJS + Prisma + PostgreSQL + REST + Modular Monolith.
- تصميم Multi-Tenancy وعزل بيانات المؤسسات.
- مراجعة `quizy-backend`, `quizy-mobile`, `quizy-admin`.
- تصنيف Modules إلى KEEP / REFACTOR / MOVE / REPLACE / DEFER / REMOVE / NEW.
- تجهيز ERD v1.
- تجهيز Domain Map.
- تجهيز Roles Matrix أولية.
- تجهيز Migration Map من Quizy.
- تجهيز Audit/Soft Delete conventions.
- تثبيت API conventions.

## Deliverables
- PRD baseline.
- System Architecture.
- ERD v1.
- Domain Map.
- Quizy reuse plan.
- Open Questions.
- MVP scope.

## خارج النطاق
لا Features تشغيلية كبيرة بعد.


---

## Scope Exclusions

يتم استبعاد:

```text
Automated Quizzes
Question Bank
Quiz Attempts
Auto-Grading
Quiz Analytics
Subscriptions
```

ولا يتم إنشاء Domain أو Database schema خاص بها ضمن الـCore الحالي.
