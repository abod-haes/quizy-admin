# Quizy Admin

لوحة إدارة مخصصة لمشروع Quizy لإدارة الاختبارات، الدروس، الوحدات، المدرسين، الطلاب، ومراجعة التحويل من ملفات الاختبارات إلى بيانات جاهزة للنشر.

## ما تغيّر في هذا الفرع

- تحويل هوية المشروع من قالب عام / CMS قديم إلى Quizy Admin.
- إضافة Dashboard رئيسية لمسار العمل التعليمي.
- استبدال عناصر السايدبار القديمة بعناصر Quizy الفعلية.
- إضافة صفحات placeholders احترافية للأقسام التي تحتاج ربط API لاحقًا.
- حذف ملف `postman.json` القديم من الريبو.

## أقسام اللوحة المقترحة

- Dashboard
- Quiz Builder
- Quizzes
- Lessons
- Units
- Teachers
- Students
- Review Queue
- Settings

## تطويرات ضرورية ليصير المشروع دايناميك بالكامل

1. تثبيت عقود API النهائية لكل مورد: quizzes, lessons, units, teachers, entities, files.
2. بناء CRUD modules من config موحد بدل تكرار الجداول والنماذج يدويًا.
3. إضافة Review Queue للأسئلة التي تحتاج إجابة صحيحة، صورة، أو توضيح.
4. ربط الواجهات بـ React Query بدل البيانات المؤقتة.
5. إضافة صلاحيات واضحة لأدوار admin, reviewer, content operator.

## التشغيل

```bash
npm install
npm run dev
```

## البناء

```bash
npm run build
```
