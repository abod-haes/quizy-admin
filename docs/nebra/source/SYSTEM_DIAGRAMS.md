# NEBRA --- System Diagrams

## 1. High Level Architecture

``` mermaid
flowchart TD
    PA[Platform Admin Dashboard]

    MW[Management Web Dashboard]
    MA[Management Mobile App]

    SA[Student App]
    PPA[Parent App]

    API[NEBRA Backend API]

    DB[(PostgreSQL Database)]
    CACHE[(Redis Cache)]
    QUEUE[Background Jobs Queue]

    PA --> API
    MW --> API
    MA --> API
    SA --> API
    PPA --> API

    API --> DB
    API --> CACHE
    API --> QUEUE
```

------------------------------------------------------------------------

# 2. Main Domains

``` mermaid
flowchart LR
    NEBRA[NEBRA Platform]

    NEBRA --> Identity[Identity & Permissions]
    NEBRA --> Institutions[Institutions]
    NEBRA --> Academic[Academic System]
    NEBRA --> Learning[Courses & AI]
    NEBRA --> Subs[Subscriptions]
    NEBRA --> Finance[Finance]
    NEBRA --> Communication[Notifications]
    NEBRA --> Results[Official Results]
```

------------------------------------------------------------------------

# 3. Institution Structure

``` mermaid
flowchart TD
    Institution[Institution]

    Institution --> School[School]
    Institution --> Institute[Institute]

    School --> Year[Academic Year]
    Year --> Grade[Grade]
    Grade --> Section[Section]
    Section --> Student[Student]

    Institute --> Subject[Subject]
    Subject --> Group[Group]
    Group --> Enrollment[Student Enrollment]
```

------------------------------------------------------------------------

# 4. User Roles Structure

``` mermaid
flowchart TD
    User[User]

    User --> PlatformAdmin[Platform Admin]

    User --> Director[School / Institute Director]
    User --> Admin[Administrative Staff]
    User --> Supervisor[Supervisor]
    User --> Teacher[Teacher]
    User --> Accountant[Accountant]

    User --> Student[Student]
    User --> Parent[Parent]
    User --> Instructor[Independent Instructor]
```

------------------------------------------------------------------------

# 5. Permission Scope

``` mermaid
flowchart TD
    Role[Role]

    Role --> Permission[Permissions]
    Role --> Scope[Scope]

    Teacher[Teacher]
    Supervisor[Supervisor]
    Admin[Administrative Staff]
    Director[Director]

    Scope --> Teacher
    Scope --> Supervisor
    Scope --> Admin
    Scope --> Director

    Teacher --> AssignedClasses[Assigned Subjects / Groups]
    Supervisor --> AssignedGrades[Assigned Grades / Sections]
    Admin --> AllInstitution[Entire Institution]
    Director --> FullAccess[Full Institution Access]
```

------------------------------------------------------------------------

# 6. Student Model

``` mermaid
flowchart TD
    Account[User Account]

    Account --> StudentProfile[Student Profile]

    StudentProfile --> StudentRecord[Student Record]

    StudentRecord --> SchoolMembership[School Membership]
    StudentRecord --> InstituteMembership[Institute Membership]

    Parent[Parent]
    Parent --> StudentRecord
```

------------------------------------------------------------------------

# 7. Academic Exam Flow

``` mermaid
flowchart TD
    Create[Create Academic Exam]

    Create --> Subject[Choose Subject]
    Create --> Target[Choose Grade / Section]
    Create --> Template[Download Excel Template]

    Template --> Upload[Upload Grades]

    Upload --> Validate[Validate Data]

    Validate --> Draft[Save Draft]

    Draft --> Publish[Publish Results]

    Publish --> StudentNotify[Notify Students]
    Publish --> ParentOption[Optional Parent Notification]
```

------------------------------------------------------------------------

# 8. Course & AI Flow

``` mermaid
flowchart TD
    CourseSource[Course Source]

    CourseSource --> Platform[NEBRA Platform]
    CourseSource --> InstitutionCourse[Institution]
    CourseSource --> InstructorCourse[Independent Instructor]

    Platform --> Course[Course]
    InstitutionCourse --> Course
    InstructorCourse --> Course

    Course --> Lessons[Lessons]
    Lessons --> Resources[Resources]

    Student[Student]
    Student --> AI[NEBRA AI Assistant]
    AI --> Course
    AI --> Lesson
```

------------------------------------------------------------------------

# 9. Finance Flow

``` mermaid
flowchart TD
    Student[Student]

    Student --> Charges[Charges]
    Student --> Payments[Payments]

    Charges --> Balance[Balance Calculation]
    Payments --> Balance

    Parent[Parent]
    Parent --> View[View Payment History]

    Accountant[Accountant]
    Accountant --> Charges
    Accountant --> Payments
```

------------------------------------------------------------------------

# 10. Notification Flow

``` mermaid
sequenceDiagram
    actor User
    participant NEBRA
    participant Queue
    participant Push
    participant WhatsApp

    User->>NEBRA: Create Event
    NEBRA->>Queue: Create Notification Job
    Queue->>Push: Send Push Notification
    Queue->>WhatsApp: Send WhatsApp Message
```

------------------------------------------------------------------------

# 11. NEBRA Development Phases

``` mermaid
flowchart LR
    P1[Foundation]
    P2[Identity & Institutions]
    P3[Academic Structure]
    P4[Academic Operations]
    P5[Courses + AI]
    P6[Student & Parent Apps]
    P7[Finance]
    P8[Communication]
    P9[Official Results]

    P1 --> P2 --> P3 --> P4 --> P5 --> P6 --> P7 --> P8 --> P9
```


# Subscription Gating

```mermaid
flowchart TD
    Student[Student]
    Subscription[Active NEBRA Subscription]
    AI[AI Assistant]
    Public[Public Courses]
    Institution[Institution Targeted Courses]

    Student --> Subscription
    Subscription -->|AI entitlement| AI
    Subscription -->|Public Courses entitlement| Public
    Student -->|Institution membership + target| Institution
```
