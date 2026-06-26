# Quizy Admin Full Integration Plan

هذه الخطة هي مسار التنفيذ الكامل لتحويل لوحة Quizy Admin إلى لوحة إنتاجية متصلة بالكامل مع Quizzy API، مع Auth، CRUD، صلاحيات، ترجمة، Validation، ملفات، ونشر.

## 1. قواعد التنفيذ

- أي منطق متكرر يوضع داخل `src/shared` وليس داخل صفحات منفصلة.
- أي شاشة module توضع داخل `src/modules/<module-name>`.
- كل endpoint يجب أن يكون معرفًا داخل `src/shared/constants/api-endpoints.ts`.
- كل route يجب أن يكون معرفًا داخل `src/app/router/app.route.ts` و/أو route registry.
- كل النصوص يجب أن تأتي من ملفات الترجمة العربية والإنجليزية.
- كل form يجب أن يحتوي validation schema.
- لا يتم استخدام `any` إلا عند الضرورة مع تضييق النوع لاحقًا.
- لا يتم بناء CRUD جديد بالنسخ واللصق؛ يجب استخدام shared CRUD engine.

## 2. Auth and Session

### المطلوب

- Login برقم الهاتف + رمز الدولة + كلمة المرور.
- تخزين JWT من خلال adapter واحد.
- إرسال `Authorization: Bearer <token>` تلقائيًا.
- إرسال `Accept-Language` حسب اللغة الحالية.
- جلب المستخدم الحالي عند فتح التطبيق من `/api/Auth/current-user`.
- حماية routes عبر `RequireAuth` و `RoleGuard`.
- logout يمسح التوكن والكاش ويرجع إلى login.
- عدم بناء refresh token وهمي، لأن العقد الحالي لا يثبت refresh endpoint.

### الشاشات

- `/login`
- `/auth/register`
- `/auth/register/verify`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/account/profile`
- `/account/change-password`

### ملفات التنفيذ

- `src/modules/auth/services/login.services.ts`
- `src/modules/auth/pages/login.page.tsx`
- `src/shared/auth/quizy-permissions.ts`
- `src/shared/validation/auth.schemas.ts`
- `src/app/router/require-auth.guard.tsx`

## 3. API Layer

### المطلوب

- API client واحد:
  - `get`
  - `post`
  - `put`
  - `patch`
  - `delete`
  - `upload`
  - `downloadBlob`
- معالجة `application/problem+json` وتحويلها إلى `AppError`.
- عرض field errors داخل الفورم.
- عند 401: redirect إلى login.
- عند 403: عرض رسالة صلاحيات وإخفاء الأكشن مستقبلًا.
- دعم pagination: `Page`, `PerPage` و response shape: `items`, `totalCount`, `pageNumber`, `pageSize`.

### ملفات التنفيذ

- `src/core/api/http.services.ts`
- `src/shared/api/api-client.ts`
- `src/shared/api/api.types.ts`
- `src/shared/api/query-keys.ts`
- `src/shared/constants/api-endpoints.ts`

## 4. Design System

### المطلوب

- خط عربي موحد: Cairo.
- كاردات بنفس روح Quizy: rounded، soft border، glass surface، subtle motion.
- أزرار بنفس الهوية: purple accent، lift on hover، shadow glow.
- Inputs بنفس الستايل: rounded، soft border، focus glow.
- Native select يأخذ نفس الستايل عبر `quizy-select-field`.
- Table wrapper يأخذ `quizy-table-shell`.

### ملفات التنفيذ

- `src/index.css`
- `src/components/ui/card.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/button.tsx` عند السماح بتعديله مباشرة، أو global `[data-slot='button']` من CSS.

## 5. Translation

### المطلوب

- Arabic first, English supported.
- RTL عندما تكون اللغة عربية.
- عدم ظهور translation keys مثل `sidebar.items.dashboard`.
- Namespaces أساسية:
  - `layout`
  - `sidebar`
  - `login`
  - `dashboard`
  - `content-crud`
  - `auth`
  - `validation`
  - `errors`
  - `common`

### ملفات التنفيذ

- `src/app/i18n.ts`
- `src/app/locales/ar/*.json`
- `src/app/locales/en/*.json`

## 6. CRUD Engine

### المطلوب

- CRUD موحد يقرأ config ويولد:
  - list
  - create
  - update
  - delete
  - pagination
  - relation select
  - validation
  - loading/empty/error states
- دعم relation endpoints مثل `Brief` للـ dropdowns.
- دعم nested resources لاحقًا مثل course sessions/materials.

### ملفات التنفيذ

- `src/shared/crud/crud.types.ts`
- `src/shared/crud/crud-api.ts`
- `src/modules/content-crud/content-crud.config.ts`
- `src/modules/content-crud/pages/academic-content-crud.page.tsx`

## 7. ربط الموديولات حسب الأولوية

### المرحلة الأولى: Academic Content

- Classes
- Subjects
- Units
- Lessons

الحالة: بدأ الربط على PR الحالي.

### المرحلة الثانية: Users

- Teachers
- Students
- Users

المطلوب:

- CRUD lists.
- details/edit.
- role badge.
- image/resource relation عند الحاجة.
- filters حسب الاسم/الهاتف إن كان endpoint يدعمها.

### المرحلة الثالثة: Quiz System

- Quizzes
- Questions/Qestions
- Quiz Builder

المطلوب:

- CRUD عادي للقوائم.
- Builder خاص لإنشاء quiz كامل.
- validation يضمن أن كل سؤال لديه answer صحيح واحد على الأقل.
- دعم `MathLm` preview.
- JSON import/export.
- lessonIds/entityIds/fileIds selectors.

### المرحلة الرابعة: Resources and Files

- Resources
- upload multipart.
- preview.
- download blob.
- file type icons.
- لا يتم قراءة binary كـ JSON.

### المرحلة الخامسة: Courses

- Courses
- CourseSessions
- CourseMaterials
- CourseComments
- CourseTeacherNotes
- CourseQrCodes
- Purchases/QR flows

### المرحلة السادسة: Admin Utilities

- Ads
- PageContents
- Notifications
- PointsOfSale
- QrCodes
- Logs download
- Statistics
- Telegram health

## 8. Dashboard Dynamic

### المطلوب

- استبدال الأرقام الثابتة ببيانات API.
- Cards:
  - teachers count
  - students count
  - quizzes count
  - lessons count
  - resources count
  - pending review count
- Recent lists:
  - آخر اختبارات
  - آخر دروس
  - آخر ملفات مرفوعة
- Quick actions:
  - إنشاء اختبار
  - إضافة درس
  - إضافة مدرس
  - رفع ملف

## 9. Permissions

### الأدوار

- `SuperAdmin`: كل الصلاحيات.
- `Teacher`: content, quizzes, questions, resources, courses.
- `Student`: وصول محدود أو إخفاء أغلب لوحة الإدارة.

### أماكن التطبيق

- sidebar visibility.
- route guards.
- CRUD actions.
- row actions.
- buttons.

## 10. Validation

### shared primitives

- `requiredString`
- `optionalString`
- `uuidField`
- `positiveInt`
- `paginationSchema`
- `phoneSchema`
- `passwordSchema`
- `priceSchema`
- `arrayOfUuid`

### module schemas

- auth schemas.
- academic content schemas.
- user schemas.
- quiz schemas.
- resource schemas.
- course schemas.

## 11. Production Readiness

### المطلوب

- `.env.example`
- env validation.
- CI workflow:
  - install
  - lint
  - typecheck
  - build
- Dockerfile.
- nginx config للـ SPA fallback.
- README محدث.
- منع commit لأي secrets أو postman collection.

## 12. ترتيب التنفيذ التالي

1. إكمال polish للـ UI components.
2. ربط Teachers/Students.
3. ربط Users عند الحاجة.
4. بناء Quiz Builder foundation.
5. ربط Quizzes/Questions.
6. ربط Resources upload/download.
7. جعل Dashboard dynamic.
8. ربط Courses ecosystem.
9. ربط Admin utilities.
10. CI/deploy.
