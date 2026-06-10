# LMS API Documentation

> **Base URL:** `http://127.0.0.1:8000/api/v2`
> **Content-Type:** `application/json`
> **Last Updated:** 2026-04-15
> **Auth:** Laravel Sanctum (Bearer token). See [Section 16: Authentication Guide](#16-authentication-guide).

---

## Table of Contents

1. [Authentication APIs](#1-authentication-apis)
   - [1.1 Login](#11-login)
   - [1.2 Register](#12-register)
   - [1.3 Google OAuth](#13-google-oauth)
   - [1.4 Logout](#14-logout)
   - [1.5 Get Current User](#15-get-current-user)
2. [Learner APIs -- Dashboard](#2-learner-apis--dashboard)
   - [2.1 Get Dashboard](#21-get-dashboard)
3. [Learner APIs -- Courses & Lessons](#3-learner-apis--courses--lessons)
   - [3.1 List Enrolled Courses](#31-list-enrolled-courses)
   - [3.2 Get Course Detail](#32-get-course-detail)
   - [3.3 Get Lesson Content](#33-get-lesson-content)
   - [3.4 Mark Lesson Complete](#34-mark-lesson-complete)
4. [Learner APIs -- Assessments](#4-learner-apis--assessments)
   - [4.1 List Course Assessments](#41-list-course-assessments)
   - [4.2 Start Assessment Attempt](#42-start-assessment-attempt)
   - [4.3 Submit Attempt Answers](#43-submit-attempt-answers)
   - [4.4 Review Completed Attempt](#44-review-completed-attempt)
5. [Learner APIs -- Certificates](#5-learner-apis--certificates)
   - [5.1 List My Certificates](#51-list-my-certificates)
   - [5.2 Generate Certificate](#52-generate-certificate)
   - [5.3 Download Certificate](#53-download-certificate)
6. [Learner APIs -- Bookmarks](#6-learner-apis--bookmarks)
   - [6.1 List Bookmarks](#61-list-bookmarks)
   - [6.2 Add Bookmark](#62-add-bookmark)
   - [6.3 Remove Bookmark](#63-remove-bookmark)
7. [Learner APIs -- Support Tickets](#7-learner-apis--support-tickets)
   - [7.1 List My Tickets](#71-list-my-tickets)
   - [7.2 Create Ticket](#72-create-ticket)
   - [7.3 Get Ticket Detail](#73-get-ticket-detail)
   - [7.4 Add Message to Ticket](#74-add-message-to-ticket)
8. [Admin APIs -- Content Management](#8-admin-apis--content-management)
   - [8.1 List Courses (Admin)](#81-list-courses-admin)
   - [8.2 List Course Enrollments (Admin)](#82-list-course-enrollments-admin)
   - [8.3 List Modules](#83-list-modules)
   - [8.4 Create Module](#84-create-module)
   - [8.5 Update Module](#85-update-module)
   - [8.6 Delete Module](#86-delete-module)
   - [8.7 Reorder Modules](#87-reorder-modules)
   - [8.8 List Lessons](#88-list-lessons)
   - [8.9 Create Lesson](#89-create-lesson)
   - [8.10 Update Lesson](#810-update-lesson)
   - [8.11 Delete Lesson](#811-delete-lesson)
   - [8.12 Reorder Lessons](#812-reorder-lessons)
9. [Admin APIs -- Assessments](#9-admin-apis--assessments)
   - [9.1 List Assessments](#91-list-assessments)
   - [9.2 Create Assessment](#92-create-assessment)
   - [9.3 Update Assessment](#93-update-assessment)
   - [9.4 Delete Assessment](#94-delete-assessment)
   - [9.5 List Questions](#95-list-questions)
   - [9.6 Create Question](#96-create-question)
   - [9.7 Update Question](#97-update-question)
   - [9.8 Delete Question](#98-delete-question)
   - [9.9 Bulk Import Questions](#99-bulk-import-questions)
10. [Admin APIs -- Certificates](#10-admin-apis--certificates)
    - [10.1 List All Certificates](#101-list-all-certificates)
    - [10.2 Issue Certificate](#102-issue-certificate)
    - [10.3 Revoke Certificate](#103-revoke-certificate)
    - [10.4 List Certificate Templates](#104-list-certificate-templates)
    - [10.5 Create Certificate Template](#105-create-certificate-template)
    - [10.6 Update Certificate Template](#106-update-certificate-template)
11. [Admin APIs -- Learning Paths](#11-admin-apis--learning-paths)
    - [11.1 List Learning Paths](#111-list-learning-paths)
    - [11.2 Create Learning Path](#112-create-learning-path)
    - [11.3 Update Learning Path](#113-update-learning-path)
    - [11.4 Delete Learning Path](#114-delete-learning-path)
    - [11.5 Sync Courses to Learning Path](#115-sync-courses-to-learning-path)
12. [Admin APIs -- Support Tickets](#12-admin-apis--support-tickets)
    - [12.1 List All Tickets](#121-list-all-tickets)
    - [12.2 Get Ticket Detail](#122-get-ticket-detail)
    - [12.3 Update Ticket](#123-update-ticket)
    - [12.4 Admin Reply to Ticket](#124-admin-reply-to-ticket)
13. [Admin APIs -- Corporate Participants](#13-admin-apis--corporate-participants)
    - [13.1 List Corporate Participants](#131-list-corporate-participants)
    - [13.2 Create Corporate Participant](#132-create-corporate-participant)
    - [13.3 Bulk Create Corporate Participants](#133-bulk-create-corporate-participants)
    - [13.4 Update Corporate Participant](#134-update-corporate-participant)
14. [Data Models](#14-data-models)
15. [Error Handling](#15-error-handling)
16. [Authentication Guide](#16-authentication-guide)

---

## 1. Authentication APIs

Base path: `/api/v2/auth`

---

### 1.1 Login

Authenticate with email and password. Returns a Sanctum bearer token.

**Endpoint:** `POST /auth/login`

**Auth:** Public

**Request Body:**

```json
{
  "email": "learner@example.com",
  "password": "secretpassword"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User's email address |
| `password` | string | Yes | User's password |

**Response:** `200 OK`

```json
{
  "token": "1|abc123def456...",
  "user": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "learner@example.com",
    "role": {
      "name": "Customer",
      "slug": "customer"
    },
    "is_active": true
  }
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `422` | `{"message": "...", "errors": {"email": ["The provided credentials are incorrect."]}}` | Invalid email or password |
| `403` | `{"error": "Account is deactivated"}` | User account is deactivated |

**Notes:**
- The token includes abilities scoped by role: `lms:learner` for customers, `lms:learner` + `lms:admin` for `lms_admin` and `super_admin` roles
- Store the returned token and include it in subsequent requests as `Authorization: Bearer <token>`

---

### 1.2 Register

Create a new user account and return a Sanctum token.

**Endpoint:** `POST /auth/register`

**Auth:** Public

**Request Body:**

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "newuser@example.com",
  "password": "secretpassword",
  "password_confirmation": "secretpassword"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `first_name` | string | Yes | First name (max 100 chars) |
| `last_name` | string | Yes | Last name (max 100 chars) |
| `email` | string | Yes | Must be unique across all users |
| `password` | string | Yes | Minimum 8 characters |
| `password_confirmation` | string | Yes | Must match `password` |

**Response:** `201 Created`

```json
{
  "token": "2|xyz789ghi012...",
  "user": {
    "id": 2,
    "first_name": "John",
    "last_name": "Doe",
    "email": "newuser@example.com",
    "role": {
      "name": "Customer",
      "slug": "customer"
    },
    "is_active": true
  }
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `422` | `{"message": "...", "errors": {"email": ["The email has already been taken."]}}` | Email already registered |
| `422` | `{"message": "...", "errors": {"password": ["The password field confirmation does not match."]}}` | Password mismatch |

**Notes:**
- New users are automatically assigned the `customer` role
- Account is active immediately upon registration

---

### 1.3 Google OAuth

Sign in or register via Google. The frontend handles the Google OAuth flow and sends the user profile data to this endpoint.

**Endpoint:** `POST /auth/google`

**Auth:** Public

**Request Body:**

```json
{
  "email": "user@gmail.com",
  "first_name": "John",
  "last_name": "Doe",
  "google_id": "118234567890123456789"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Google account email |
| `first_name` | string | Yes | From Google profile (max 100 chars) |
| `last_name` | string | No | From Google profile (max 100 chars) |
| `google_id` | string | Yes | Google account unique ID |

**Response:** `200 OK`

```json
{
  "token": "3|mno345pqr678...",
  "user": {
    "id": 3,
    "first_name": "John",
    "last_name": "Doe",
    "email": "user@gmail.com",
    "role": {
      "name": "Customer",
      "slug": "customer"
    },
    "is_active": true
  }
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `403` | `{"error": "Account is deactivated"}` | Existing account is deactivated |
| `422` | `{"message": "...", "errors": {...}}` | Validation failed |

**Notes:**
- If the email already exists, it signs in the existing user (does not create a duplicate)
- If the email does not exist, a new `customer` account is created with a random password
- The `google_id` is accepted but not stored on the user model in the current implementation

---

### 1.4 Logout

Revoke the current access token.

**Endpoint:** `POST /auth/logout`

**Auth:** Sanctum

**Request Body:** None

**Response:** `200 OK`

```json
{
  "message": "Logged out"
}
```

**Notes:**
- Only revokes the token used in the current request; other tokens for the same user remain valid

---

### 1.5 Get Current User

Return the authenticated user's profile.

**Endpoint:** `GET /auth/me`

**Auth:** Sanctum

**Response:** `200 OK`

```json
{
  "user": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "learner@example.com",
    "role": {
      "name": "Customer",
      "slug": "customer"
    },
    "is_active": true
  }
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |

---

## 2. Learner APIs -- Dashboard

Base path: `/api/v2/lms`

---

### 2.1 Get Dashboard

Returns a consolidated dashboard with enrolled courses, pending payments, bookmarks, certificates, and suggested courses. Uses authenticated user from bearer token.

**Endpoint:** `GET /lms/dashboard`

**Auth:** Sanctum

**Response:** `200 OK`

```json
{
  "enrolled_courses": [
    {
      "enrollment_id": 1,
      "course": {
        "id": 1,
        "name": "PMP Certification Training",
        "slug": "pmp-certification",
        "banner_image_url": "https://cdn.example.com/pmp-banner.jpg"
      },
      "progress_percentage": 35.71,
      "status": "active"
    }
  ],
  "pending_payments": [
    {
      "order_id": 10,
      "order_number": "ORD-2026-00010",
      "course_name": "PMP Certification Training",
      "pending_amount": 250.00,
      "currency_code": "USD"
    }
  ],
  "bookmarks": [
    {
      "id": 1,
      "course": {
        "id": 1,
        "name": "PMP Certification Training",
        "slug": "pmp-certification"
      },
      "lesson": {
        "id": 5,
        "title": "Managing Conflict"
      }
    }
  ],
  "certificates": [
    {
      "id": 1,
      "certificate_number": "CERT-2026-0001",
      "course_name": "PMP Certification Training",
      "issued_at": "2026-04-14T10:00:00.000000Z"
    }
  ],
  "suggested_courses": [
    {
      "id": 5,
      "name": "PRINCE2 Foundation",
      "slug": "prince2-foundation",
      "category": "Project Management",
      "banner_image_url": "https://cdn.example.com/prince2-banner.jpg"
    }
  ]
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |

**Notes:**
- Each section returns a maximum of 5 items
- `enrolled_courses` excludes expired enrollments, sorted by most recent first
- `pending_payments` includes orders with `pending` or `partially_paid` payment status
- `suggested_courses` are active courses the user is not enrolled in
- `certificates` only includes those with `issued` status

---

## 3. Learner APIs -- Courses & Lessons

Base path: `/api/v2/lms`

---

### 3.1 List Enrolled Courses

Returns all courses the learner is enrolled in, with progress and schedule info. Uses authenticated user from bearer token.

**Endpoint:** `GET /lms/courses`

**Auth:** Sanctum

**Response:** `200 OK`

```json
{
  "courses": [
    {
      "enrollment_id": 1,
      "course": {
        "id": 1,
        "name": "PMP Certification Training",
        "slug": "pmp-certification",
        "short_name": "PMP",
        "banner_image_url": null,
        "duration_hours": 35
      },
      "schedule": {
        "start_date": "2026-05-04",
        "end_date": "2026-05-07",
        "training_mode": "live_virtual"
      },
      "progress_percentage": 35.71,
      "status": "active",
      "granted_at": "2026-04-14T10:30:00.000000Z"
    }
  ]
}
```

**Status values:** `active`, `completed`, `suspended`, `expired`

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |

**Notes:**
- Expired enrollments are excluded from the list
- Sorted by `granted_at` descending (most recent first)
- `progress_percentage` is 0-100, calculated from completed lessons / total lessons

---

### 3.2 Get Course Detail

Returns course with modules, lessons, and per-lesson progress for the learner. Uses authenticated user from bearer token to include enrollment info and per-lesson progress.

**Endpoint:** `GET /lms/courses/{courseId}`

**Auth:** Sanctum

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `courseId` | integer | Course ID |

**Response:** `200 OK`

```json
{
  "course": {
    "id": 1,
    "name": "PMP Certification Training",
    "slug": "pmp-certification",
    "description": "Full PMP training program...",
    "duration_hours": 35
  },
  "enrollment": {
    "id": 1,
    "progress_percentage": 35.71,
    "status": "active"
  },
  "modules": [
    {
      "id": 1,
      "title": "People Domain",
      "description": "Understanding team dynamics...",
      "sort_order": 1,
      "lessons": [
        {
          "id": 1,
          "title": "Introduction to People Domain",
          "description": "Overview of the People domain...",
          "content_type": "video",
          "duration_minutes": 45,
          "is_preview": true,
          "sort_order": 1,
          "progress_status": "completed"
        },
        {
          "id": 2,
          "title": "Managing Conflict",
          "description": "Conflict resolution strategies...",
          "content_type": "video",
          "duration_minutes": 30,
          "is_preview": false,
          "sort_order": 2,
          "progress_status": "in_progress"
        },
        {
          "id": 3,
          "title": "People Domain Study Guide",
          "description": null,
          "content_type": "pdf",
          "duration_minutes": null,
          "is_preview": false,
          "sort_order": 4,
          "progress_status": "not_started"
        }
      ],
      "completed_count": 1,
      "total_count": 5
    }
  ]
}
```

**`enrollment`** is `null` if the authenticated user has no enrollment for this course.

**`progress_status` values:** `not_started`, `in_progress`, `completed`

**`content_type` values:** `video`, `pdf`, `external`, `quiz`

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `404` | `{"message": "No query results for model [Course]"}` | Course not found |

**Notes:**
- Only active modules and lessons are returned (inactive ones are filtered out)
- `is_preview: true` lessons can be viewed without enrollment (for marketing)
- `completed_count` and `total_count` per module help render progress bars

---

### 3.3 Get Lesson Content

Returns full lesson content including the content URL. Uses authenticated user from bearer token. Automatically marks the lesson as "in progress" if the learner is enrolled.

**Endpoint:** `GET /lms/courses/{courseId}/lessons/{lessonId}`

**Auth:** Sanctum

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `courseId` | integer | Course ID |
| `lessonId` | integer | Lesson ID |

**Response:** `200 OK`

```json
{
  "lesson": {
    "id": 2,
    "title": "Managing Conflict",
    "description": "Learn strategies for managing conflict in project teams...",
    "content_type": "video",
    "content_url": "https://www.youtube.com/embed/abc123",
    "duration_minutes": 30,
    "is_preview": false,
    "module": {
      "id": 1,
      "title": "People Domain"
    }
  },
  "progress_status": "in_progress"
}
```

**`content_url` values by content_type:**

| content_type | content_url example |
|-------------|-------------------|
| `video` | `https://www.youtube.com/embed/abc123` or `https://vimeo.com/123` |
| `pdf` | `https://s3.amazonaws.com/bucket/guide.pdf` |
| `external` | `https://pmi.org/learning/portal` |
| `quiz` | `null` (quiz is handled by assessment endpoints in Section 4) |

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `404` | `{"message": "No query results for model [CourseLesson]"}` | Lesson not found or doesn't belong to this course |

**Notes:**
- If the authenticated user has an active enrollment, the lesson is automatically marked as `in_progress`
- If the lesson was already `completed`, the status remains `completed` (no downgrade)
- `content_url` may be `null` for quiz-type lessons

---

### 3.4 Mark Lesson Complete

Marks a lesson as completed for the learner. Uses authenticated user from bearer token. Automatically recalculates the enrollment's overall progress percentage.

**Endpoint:** `POST /lms/courses/{courseId}/lessons/{lessonId}/complete`

**Auth:** Sanctum

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `courseId` | integer | Course ID |
| `lessonId` | integer | Lesson ID |

**Request Body:** None

**Response:** `200 OK`

```json
{
  "lesson_progress": {
    "lesson_id": 2,
    "status": "completed",
    "completed_at": "2026-04-14T11:30:00.000000Z"
  },
  "enrollment": {
    "progress_percentage": 42.86,
    "status": "active"
  }
}
```

**Progress Calculation:**
```
progress_percentage = (completed_lessons / total_active_lessons) x 100
```

When progress reaches 100%, the enrollment `status` automatically changes to `completed`.

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `404` | `{"message": "No query results for model [CourseLesson]"}` | Lesson not found |
| `404` | `{"message": "No query results for model [LmsEnrollment]"}` | User not enrolled in this course |

**Notes:**
- Calling this endpoint multiple times for the same lesson is safe (idempotent)
- The `completed_at` timestamp is set on the first completion only
- If all lessons in the course are completed, enrollment status changes to `completed` and a log entry is created

---

## 4. Learner APIs -- Assessments

Base path: `/api/v2/lms`

---

### 4.1 List Course Assessments

Returns available assessments (quizzes, mock tests) for a course, with the learner's attempt history. Uses authenticated user from bearer token to include attempt counts, best score, and eligibility info.

**Endpoint:** `GET /lms/courses/{courseId}/assessments`

**Auth:** Sanctum

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `courseId` | integer | Course ID |

**Response:** `200 OK`

```json
{
  "assessments": [
    {
      "id": 1,
      "title": "PMP Module 1 Quiz",
      "type": "quiz",
      "module": {
        "id": 1,
        "title": "People Domain"
      },
      "time_limit_minutes": 30,
      "passing_percentage": 70.00,
      "question_count": 20,
      "max_attempts": 3,
      "is_randomized": true,
      "attempts_used": 1,
      "best_score": 65.00,
      "can_attempt": true,
      "attempt_blocked_reason": null
    },
    {
      "id": 2,
      "title": "PMP Full Mock Test",
      "type": "mock_test",
      "module": null,
      "time_limit_minutes": 230,
      "passing_percentage": 65.00,
      "question_count": 180,
      "max_attempts": null,
      "is_randomized": true,
      "attempts_used": 0,
      "best_score": null,
      "can_attempt": true,
      "attempt_blocked_reason": null
    }
  ]
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |

**Notes:**
- Only active assessments are returned
- `can_attempt` is `false` when the user has exhausted `max_attempts` or is not enrolled
- `attempt_blocked_reason` provides the human-readable reason when `can_attempt` is false (e.g., `"Not enrolled"`, `"Maximum attempts reached"`)
- `module` is `null` for course-level assessments (e.g., full mock tests)
- `max_attempts` of `null` means unlimited attempts

---

### 4.2 Start Assessment Attempt

Start a new assessment attempt. Uses authenticated user from bearer token. Returns the questions to display.

**Endpoint:** `POST /lms/assessments/{assessmentId}/start`

**Auth:** Sanctum

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `assessmentId` | integer | Assessment ID |

**Request Body:** None

**Response:** `201 Created`

```json
{
  "attempt_id": 5,
  "assessment": {
    "id": 1,
    "title": "PMP Module 1 Quiz",
    "time_limit_minutes": 30,
    "passing_percentage": 70.00
  },
  "questions": [
    {
      "id": 10,
      "question_text": "What is the primary role of a project manager in conflict resolution?",
      "question_type": "mcq",
      "options": [
        "Avoid the conflict",
        "Facilitate resolution between parties",
        "Escalate to senior management",
        "Ignore the conflict"
      ]
    },
    {
      "id": 11,
      "question_text": "Which leadership style is best for a self-organizing team?",
      "question_type": "mcq",
      "options": [
        "Autocratic",
        "Servant leadership",
        "Laissez-faire",
        "Transactional"
      ]
    }
  ]
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"error": "Maximum attempts reached"}` | User exceeded max_attempts |
| `404` | `{"message": "No query results for model [Assessment]"}` | Assessment not found |
| `404` | `{"message": "No query results for model [LmsEnrollment]"}` | User not enrolled in the assessment's course |

**Notes:**
- Questions are randomized if `is_randomized` is true on the assessment
- The `correct_answer` field is intentionally excluded from the response
- The `attempt_id` must be used when submitting answers

---

### 4.3 Submit Attempt Answers

Submit answers for an in-progress attempt. Scores the attempt and returns results.

**Endpoint:** `POST /lms/attempts/{attemptId}/submit`

**Auth:** Sanctum

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `attemptId` | integer | Attempt ID (from start response) |

**Request Body:**

```json
{
  "answers": [
    { "question_id": 10, "selected_answer": "Facilitate resolution between parties" },
    { "question_id": 11, "selected_answer": "Servant leadership" }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `answers` | array | Yes | Array of answer objects |
| `answers[].question_id` | integer | Yes | Question ID |
| `answers[].selected_answer` | string | Yes | The selected answer text |

**Response:** `200 OK`

```json
{
  "attempt": {
    "id": 5,
    "score": 18,
    "percentage": 90.00,
    "is_passed": true,
    "time_spent_seconds": 1245,
    "completed_at": "2026-04-14T12:00:00.000000Z"
  },
  "results": [
    {
      "question_id": 10,
      "is_correct": true
    },
    {
      "question_id": 11,
      "is_correct": true
    }
  ]
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `400` | `{"error": "This attempt has already been submitted"}` | Attempt already completed |
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `404` | `{"message": "No query results for model [AssessmentAttempt]"}` | Attempt not found |
| `422` | `{"message": "...", "errors": {...}}` | Validation failed |

**Notes:**
- Each attempt can only be submitted once; submitting again returns a 400 error
- `time_spent_seconds` is calculated from attempt start to submission
- `is_passed` is determined by comparing `percentage` to `passing_percentage`

---

### 4.4 Review Completed Attempt

Review a completed attempt with correct answers and explanations.

**Endpoint:** `GET /lms/attempts/{attemptId}/review`

**Auth:** Sanctum

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `attemptId` | integer | Attempt ID |

**Response:** `200 OK`

```json
{
  "attempt": {
    "id": 5,
    "score": 18,
    "percentage": 90.00,
    "is_passed": true,
    "time_spent_seconds": 1245
  },
  "assessment": {
    "title": "PMP Module 1 Quiz",
    "passing_percentage": 70.00
  },
  "questions": [
    {
      "question_id": 10,
      "question_text": "What is the primary role of a project manager in conflict resolution?",
      "question_type": "mcq",
      "options": [
        "Avoid the conflict",
        "Facilitate resolution between parties",
        "Escalate to senior management",
        "Ignore the conflict"
      ],
      "selected_answer": "Facilitate resolution between parties",
      "correct_answer": "Facilitate resolution between parties",
      "is_correct": true,
      "explanation": "The PM should facilitate resolution by helping parties communicate and find common ground."
    },
    {
      "question_id": 11,
      "question_text": "Which leadership style is best for a self-organizing team?",
      "question_type": "mcq",
      "options": [
        "Autocratic",
        "Servant leadership",
        "Laissez-faire",
        "Transactional"
      ],
      "selected_answer": "Servant leadership",
      "correct_answer": "Servant leadership",
      "is_correct": true,
      "explanation": "Servant leadership empowers team members and removes impediments."
    }
  ]
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `400` | `{"error": "Attempt not yet submitted"}` | Attempt has not been submitted yet |
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `404` | `{"message": "No query results for model [AssessmentAttempt]"}` | Attempt not found |

**Notes:**
- Only available for completed attempts (those that have been submitted)
- Includes the `correct_answer` and `explanation` for each question so the learner can study

---

## 5. Learner APIs -- Certificates

Base path: `/api/v2/lms`

---

### 5.1 List My Certificates

Returns all certificates for the authenticated learner. Uses authenticated user from bearer token.

**Endpoint:** `GET /lms/certificates`

**Auth:** Sanctum

**Response:** `200 OK`

```json
{
  "certificates": [
    {
      "id": 1,
      "certificate_number": "CERT-2026-0001",
      "course": {
        "id": 1,
        "name": "PMP Certification Training"
      },
      "status": "issued",
      "issued_at": "2026-04-14T10:00:00.000000Z",
      "pdf_url": "https://s3.amazonaws.com/bucket/certificates/cert-001.pdf"
    }
  ]
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |

**Notes:**
- Sorted by `issued_at` descending (most recent first)
- Returns certificates in all statuses (issued, revoked)

---

### 5.2 Generate Certificate

Generate a certificate for a completed enrollment. Uses authenticated user from bearer token. Checks eligibility before generating.

**Endpoint:** `POST /lms/certificates/{enrollmentId}/generate`

**Auth:** Sanctum

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `enrollmentId` | integer | Enrollment ID (must belong to the authenticated user) |

**Request Body:** None

**Response:** `201 Created`

```json
{
  "certificate": {
    "id": 1,
    "certificate_number": "CERT-2026-0001",
    "status": "issued",
    "issued_at": "2026-04-14T10:00:00.000000Z",
    "pdf_url": "https://s3.amazonaws.com/bucket/certificates/cert-001.pdf"
  },
  "eligibility": {
    "eligible": true
  }
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `400` | `{"error": "Not eligible", "reason": "Course not completed"}` | Eligibility check failed |
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `404` | `{"error": "Enrollment not found"}` | Enrollment not found or does not belong to the authenticated user |

**Notes:**
- Eligibility typically requires enrollment status to be `completed` (100% lesson progress)
- A certificate is generated once; calling again after generation may create a duplicate

---

### 5.3 Download Certificate

Get the download URL for an issued certificate.

**Endpoint:** `GET /lms/certificates/{certificateId}/download`

**Auth:** Sanctum

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `certificateId` | integer | Certificate ID |

**Response:** `200 OK`

```json
{
  "certificate_number": "CERT-2026-0001",
  "pdf_url": "https://s3.amazonaws.com/bucket/certificates/cert-001.pdf",
  "issued_at": "2026-04-14T10:00:00.000000Z"
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `404` | `{"error": "Certificate not found or not yet issued"}` | Certificate does not exist or status is not `issued` |

**Notes:**
- Only certificates with status `issued` can be downloaded
- Revoked certificates will return a 404

---

## 6. Learner APIs -- Bookmarks

Base path: `/api/v2/lms`

---

### 6.1 List Bookmarks

Returns all bookmarks for the authenticated learner, with course and lesson info. Uses authenticated user from bearer token.

**Endpoint:** `GET /lms/bookmarks`

**Auth:** Sanctum

**Response:** `200 OK`

```json
{
  "bookmarks": [
    {
      "id": 1,
      "course": {
        "id": 1,
        "name": "PMP Certification Training",
        "slug": "pmp-certification"
      },
      "lesson": {
        "id": 5,
        "title": "Managing Conflict"
      },
      "created_at": "2026-04-14T09:00:00.000000Z"
    },
    {
      "id": 2,
      "course": {
        "id": 1,
        "name": "PMP Certification Training",
        "slug": "pmp-certification"
      },
      "lesson": null,
      "created_at": "2026-04-13T15:00:00.000000Z"
    }
  ]
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |

**Notes:**
- Sorted by most recent first
- A bookmark can reference a course only (lesson is `null`) or a specific lesson within a course

---

### 6.2 Add Bookmark

Add a bookmark for a course or a specific lesson. Uses authenticated user from bearer token.

**Endpoint:** `POST /lms/bookmarks`

**Auth:** Sanctum

**Request Body:**

```json
{
  "course_id": 1,
  "course_lesson_id": 5
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `course_id` | integer | No | Course ID (must exist in `courses`) |
| `course_lesson_id` | integer | No | Lesson ID (must exist in `course_lessons`) |

**Response:** `201 Created`

```json
{
  "bookmark": {
    "id": 3,
    "course_id": 1,
    "course_lesson_id": 5,
    "created_at": "2026-04-14T12:00:00.000000Z",
    "updated_at": "2026-04-14T12:00:00.000000Z",
    "course": {
      "id": 1,
      "name": "PMP Certification Training",
      "slug": "pmp-certification"
    },
    "lesson": {
      "id": 5,
      "title": "Managing Conflict"
    }
  }
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `409` | `{"error": "Bookmark already exists"}` | Duplicate bookmark (same user + course + lesson combination) |
| `422` | `{"message": "...", "errors": {...}}` | Validation failed |

**Notes:**
- Duplicate detection is based on the combination of authenticated user, `course_id`, and `course_lesson_id`
- Both `course_id` and `course_lesson_id` are individually optional, but at least one should be provided for meaningful bookmarks

---

### 6.3 Remove Bookmark

Remove an existing bookmark.

**Endpoint:** `DELETE /lms/bookmarks/{bookmarkId}`

**Auth:** Sanctum

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `bookmarkId` | integer | Bookmark ID |

**Response:** `200 OK`

```json
{
  "message": "Bookmark removed"
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `404` | `{"error": "Bookmark not found"}` | Bookmark does not exist or does not belong to the authenticated user |

**Notes:**
- Bookmarks are scoped to the authenticated user -- a user cannot delete another user's bookmarks

---

## 7. Learner APIs -- Support Tickets

Base path: `/api/v2/lms`

---

### 7.1 List My Tickets

Returns all support tickets created by the authenticated learner. Uses authenticated user from bearer token.

**Endpoint:** `GET /lms/tickets`

**Auth:** Sanctum

**Response:** `200 OK`

```json
{
  "tickets": [
    {
      "id": 1,
      "category": "technical",
      "subject": "Video not loading in Module 3",
      "priority": "medium",
      "status": "open",
      "messages_count": 3,
      "created_at": "2026-04-14T08:00:00.000000Z",
      "resolved_at": null
    },
    {
      "id": 2,
      "category": "billing",
      "subject": "Invoice not received",
      "priority": "low",
      "status": "resolved",
      "messages_count": 5,
      "created_at": "2026-04-10T14:00:00.000000Z",
      "resolved_at": "2026-04-12T09:00:00.000000Z"
    }
  ]
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |

**Notes:**
- Sorted by most recent first
- `messages_count` includes both user and admin messages

---

### 7.2 Create Ticket

Create a new support ticket with an initial message. Uses authenticated user from bearer token.

**Endpoint:** `POST /lms/tickets`

**Auth:** Sanctum

**Request Body:**

```json
{
  "category": "technical",
  "subject": "Video not loading in Module 3",
  "message": "I keep getting a 403 error when trying to play the video in lesson 3.2. I've tried Chrome and Firefox.",
  "order_id": null,
  "course_id": 1
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `category` | string | Yes | Ticket category (max 100 chars), e.g., `technical`, `billing`, `content`, `account` |
| `subject` | string | Yes | Brief description (max 255 chars) |
| `message` | string | Yes | The initial message body |
| `order_id` | integer | No | Related order ID (must exist in `orders`) |
| `course_id` | integer | No | Related course ID (must exist in `courses`) |

**Response:** `201 Created`

```json
{
  "ticket": {
    "id": 3,
    "user_id": 1,
    "category": "technical",
    "subject": "Video not loading in Module 3",
    "priority": "medium",
    "status": "open",
    "order_id": null,
    "course_id": 1,
    "assigned_to": null,
    "resolved_at": null,
    "created_at": "2026-04-14T12:00:00.000000Z",
    "updated_at": "2026-04-14T12:00:00.000000Z",
    "messages": [
      {
        "id": 5,
        "support_ticket_id": 3,
        "user_id": 1,
        "message": "I keep getting a 403 error when trying to play the video in lesson 3.2. I've tried Chrome and Firefox.",
        "is_admin": false,
        "created_at": "2026-04-14T12:00:00.000000Z",
        "updated_at": "2026-04-14T12:00:00.000000Z"
      }
    ]
  }
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `422` | `{"message": "...", "errors": {...}}` | Validation failed |

**Notes:**
- The initial message is created automatically as part of the ticket creation
- Default `status` is `open` and default `priority` is `medium`
- `is_admin` is set to `false` for learner-created messages

---

### 7.3 Get Ticket Detail

Returns a ticket with all its messages. Scoped to the authenticated user -- a user cannot view another user's tickets.

**Endpoint:** `GET /lms/tickets/{ticketId}`

**Auth:** Sanctum

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `ticketId` | integer | Ticket ID |

**Response:** `200 OK`

```json
{
  "ticket": {
    "id": 1,
    "user_id": 1,
    "category": "technical",
    "subject": "Video not loading in Module 3",
    "priority": "medium",
    "status": "open",
    "order_id": null,
    "course_id": 1,
    "assigned_to": null,
    "resolved_at": null,
    "created_at": "2026-04-14T08:00:00.000000Z",
    "updated_at": "2026-04-14T10:00:00.000000Z",
    "messages": [
      {
        "id": 1,
        "support_ticket_id": 1,
        "user_id": 1,
        "message": "I keep getting a 403 error...",
        "is_admin": false,
        "created_at": "2026-04-14T08:00:00.000000Z",
        "user": {
          "id": 1,
          "first_name": "John",
          "last_name": "Doe",
          "email": "learner@example.com"
        }
      },
      {
        "id": 2,
        "support_ticket_id": 1,
        "user_id": 10,
        "message": "We've identified the issue. The video provider had a temporary outage...",
        "is_admin": true,
        "created_at": "2026-04-14T10:00:00.000000Z",
        "user": {
          "id": 10,
          "first_name": "Admin",
          "last_name": "User",
          "email": "admin@invensislearning.com"
        }
      }
    ]
  }
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `404` | `{"error": "Ticket not found"}` | Ticket does not exist |

---

### 7.4 Add Message to Ticket

Add a follow-up message to an existing ticket. Uses authenticated user from bearer token. Scoped to the authenticated user -- a user cannot message on another user's tickets.

**Endpoint:** `POST /lms/tickets/{ticketId}/messages`

**Auth:** Sanctum

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `ticketId` | integer | Ticket ID |

**Request Body:**

```json
{
  "message": "Thanks, the video is working now."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | Message body |

**Response:** `201 Created`

```json
{
  "message": {
    "id": 6,
    "support_ticket_id": 1,
    "user_id": 1,
    "message": "Thanks, the video is working now.",
    "is_admin": false,
    "created_at": "2026-04-14T14:00:00.000000Z",
    "updated_at": "2026-04-14T14:00:00.000000Z"
  }
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `404` | `{"error": "Ticket not found"}` | Ticket does not exist |
| `422` | `{"message": "...", "errors": {...}}` | Validation failed |

**Notes:**
- Messages added by learners have `is_admin: false`
- Messages added via the admin endpoint (Section 12.4) have `is_admin: true`

---

## 8. Admin APIs -- Content Management

Base path: `/api/v2/lms/admin`

All admin endpoints require Sanctum authentication with the `lms:admin` ability. The `LmsAdminMiddleware` allows users with `super_admin` or `lms_admin` roles.

---

### 8.1 List Courses (Admin)

List all courses with module/lesson/enrollment counts.

**Endpoint:** `GET /lms/admin/courses`

**Auth:** Sanctum + Admin

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category_id` | integer | No | Filter by category |
| `is_active` | boolean | No | Filter by active status |

**Response:** `200 OK`

```json
{
  "courses": [
    {
      "id": 1,
      "name": "PMP Certification Training",
      "slug": "pmp-certification",
      "short_name": "PMP",
      "course_type": "certification",
      "levels": ["foundation", "intermediate", "advanced"],
      "available_tiers": ["bronze", "silver", "gold"],
      "duration_days": 4,
      "duration_hours": 35,
      "is_active": true,
      "category": { "id": 1, "name": "Project Management" },
      "modules_count": 3,
      "lessons_count": 14,
      "assessments_count": 5,
      "enrollments_count": 2
    }
  ]
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |

---

### 8.2 List Course Enrollments (Admin)

List all enrollments for a course with learner progress.

**Endpoint:** `GET /lms/admin/courses/{courseId}/enrollments`

**Auth:** Sanctum + Admin

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `courseId` | integer | Course ID |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by enrollment status (`active`, `completed`, `suspended`, `expired`) |

**Response:** `200 OK`

```json
{
  "enrollments": [
    {
      "id": 1,
      "user": {
        "id": 4,
        "name": "John Doe",
        "email": "john.doe@example.com"
      },
      "schedule": {
        "id": 3,
        "start_date": "2026-05-04",
        "end_date": "2026-05-07",
        "training_mode": "live_virtual",
        "batch_label": null
      },
      "progress_percentage": 57.14,
      "status": "active",
      "granted_at": "2026-04-01T10:00:00.000000Z",
      "completed_at": null
    }
  ]
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `404` | `{"message": "No query results for model [Course]"}` | Course not found |

---

### 8.3 List Modules

Returns all modules for a course, ordered by sort_order, with lesson count.

**Endpoint:** `GET /lms/admin/courses/{courseId}/modules`

**Auth:** Sanctum + Admin

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `courseId` | integer | Course ID |

**Response:** `200 OK`

```json
{
  "modules": [
    {
      "id": 1,
      "course_id": 1,
      "title": "People Domain",
      "description": "Understanding team dynamics and leadership",
      "sort_order": 1,
      "is_active": true,
      "created_at": "2026-04-14T10:00:00.000000Z",
      "updated_at": "2026-04-14T10:00:00.000000Z",
      "lessons_count": 5
    },
    {
      "id": 2,
      "course_id": 1,
      "title": "Process Domain",
      "description": "Project management processes and techniques",
      "sort_order": 2,
      "is_active": true,
      "created_at": "2026-04-14T10:00:00.000000Z",
      "updated_at": "2026-04-14T10:00:00.000000Z",
      "lessons_count": 5
    }
  ]
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `404` | `{"message": "No query results for model [Course]"}` | Course not found |

---

### 8.4 Create Module

Create a new module within a course.

**Endpoint:** `POST /lms/admin/courses/{courseId}/modules`

**Auth:** Sanctum + Admin

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `courseId` | integer | Course ID |

**Request Body:**

```json
{
  "title": "New Module Title",
  "description": "Optional description for the module",
  "sort_order": 4,
  "is_active": true
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `title` | string | Yes | -- | Module title (max 255 chars) |
| `description` | string | No | `null` | Module description |
| `sort_order` | integer | No | `0` | Display order |
| `is_active` | boolean | No | `true` | Whether module is visible to learners |

**Response:** `201 Created`

```json
{
  "module": {
    "id": 4,
    "course_id": 1,
    "title": "New Module Title",
    "description": "Optional description for the module",
    "sort_order": 4,
    "is_active": true,
    "created_at": "2026-04-14T12:00:00.000000Z",
    "updated_at": "2026-04-14T12:00:00.000000Z"
  }
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `404` | `{"message": "No query results for model [Course]"}` | Course not found |
| `422` | `{"message": "...", "errors": {...}}` | Validation failed |

---

### 8.5 Update Module

Update an existing module.

**Endpoint:** `PUT /lms/admin/modules/{moduleId}`

**Auth:** Sanctum + Admin

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `moduleId` | integer | Module ID |

**Request Body:** (all fields optional)

```json
{
  "title": "Updated Module Title",
  "description": "Updated description",
  "sort_order": 2,
  "is_active": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | No | Module title (max 255 chars) |
| `description` | string | No | Module description |
| `sort_order` | integer | No | Display order |
| `is_active` | boolean | No | Whether module is visible to learners |

**Response:** `200 OK`

```json
{
  "module": {
    "id": 1,
    "course_id": 1,
    "title": "Updated Module Title",
    "description": "Updated description",
    "sort_order": 2,
    "is_active": false,
    "created_at": "2026-04-14T10:00:00.000000Z",
    "updated_at": "2026-04-14T12:30:00.000000Z"
  }
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `404` | `{"message": "No query results for model [CourseModule]"}` | Module not found |
| `422` | `{"message": "...", "errors": {...}}` | Validation failed |

---

### 8.6 Delete Module

Deletes a module and **all its lessons** (cascade delete).

**Endpoint:** `DELETE /lms/admin/modules/{moduleId}`

**Auth:** Sanctum + Admin

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `moduleId` | integer | Module ID |

**Response:** `204 No Content`

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `404` | `{"message": "No query results for model [CourseModule]"}` | Module not found |

**Warning:** This permanently deletes all lessons within the module and any learner progress records for those lessons.

---

### 8.7 Reorder Modules

Bulk update sort_order for multiple modules.

**Endpoint:** `PUT /lms/admin/modules/reorder`

**Auth:** Sanctum + Admin

**Request Body:**

```json
{
  "order": [
    { "id": 3, "sort_order": 1 },
    { "id": 1, "sort_order": 2 },
    { "id": 2, "sort_order": 3 }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `order` | array | Yes | Array of objects with `id` and `sort_order` |
| `order[].id` | integer | Yes | Module ID (must exist in `course_modules`) |
| `order[].sort_order` | integer | Yes | New sort position |

**Response:** `200 OK`

```json
{
  "message": "Modules reordered"
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `422` | `{"message": "...", "errors": {...}}` | Validation failed |

---

### 8.8 List Lessons

Returns all lessons for a module, ordered by sort_order.

**Endpoint:** `GET /lms/admin/modules/{moduleId}/lessons`

**Auth:** Sanctum + Admin

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `moduleId` | integer | Module ID |

**Response:** `200 OK`

```json
{
  "lessons": [
    {
      "id": 1,
      "course_module_id": 1,
      "title": "Introduction to People Domain",
      "description": "Overview of the People domain...",
      "content_type": "video",
      "content_url": null,
      "duration_minutes": 45,
      "sort_order": 1,
      "is_preview": true,
      "is_active": true,
      "created_at": "2026-04-14T10:00:00.000000Z",
      "updated_at": "2026-04-14T10:00:00.000000Z"
    }
  ]
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `404` | `{"message": "No query results for model [CourseModule]"}` | Module not found |

---

### 8.9 Create Lesson

Create a new lesson within a module.

**Endpoint:** `POST /lms/admin/modules/{moduleId}/lessons`

**Auth:** Sanctum + Admin

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `moduleId` | integer | Module ID |

**Request Body:**

```json
{
  "title": "Risk Assessment Techniques",
  "description": "Learn how to identify and assess project risks",
  "content_type": "video",
  "content_url": "https://www.youtube.com/embed/xyz789",
  "duration_minutes": 35,
  "sort_order": 3,
  "is_preview": false,
  "is_active": true
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `title` | string | Yes | -- | Lesson title (max 255) |
| `description` | string | No | `null` | Lesson description |
| `content_type` | string | Yes | -- | One of: `video`, `pdf`, `external`, `quiz` (max 50 chars) |
| `content_url` | string | No | `null` | URL to content (max 500). Null for quiz type. |
| `duration_minutes` | integer | No | `null` | Estimated duration in minutes (min 0) |
| `sort_order` | integer | No | `0` | Display order within module |
| `is_preview` | boolean | No | `false` | If true, lesson is accessible without enrollment |
| `is_active` | boolean | No | `true` | Whether lesson is visible to learners |

**Response:** `201 Created`

```json
{
  "lesson": {
    "id": 10,
    "course_module_id": 1,
    "title": "Risk Assessment Techniques",
    "description": "Learn how to identify and assess project risks",
    "content_type": "video",
    "content_url": "https://www.youtube.com/embed/xyz789",
    "duration_minutes": 35,
    "sort_order": 3,
    "is_preview": false,
    "is_active": true,
    "created_at": "2026-04-14T12:00:00.000000Z",
    "updated_at": "2026-04-14T12:00:00.000000Z"
  }
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `404` | `{"message": "No query results for model [CourseModule]"}` | Module not found |
| `422` | `{"message": "...", "errors": {...}}` | Validation failed |

---

### 8.10 Update Lesson

Update an existing lesson.

**Endpoint:** `PUT /lms/admin/lessons/{lessonId}`

**Auth:** Sanctum + Admin

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `lessonId` | integer | Lesson ID |

**Request Body:** (all fields optional)

```json
{
  "title": "Updated Lesson Title",
  "content_url": "https://www.youtube.com/embed/updated123",
  "is_active": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | No | Lesson title (max 255) |
| `description` | string | No | Lesson description |
| `content_type` | string | No | One of: `video`, `pdf`, `external`, `quiz` |
| `content_url` | string | No | URL to content (max 500) |
| `duration_minutes` | integer | No | Estimated duration in minutes (min 0) |
| `sort_order` | integer | No | Display order within module |
| `is_preview` | boolean | No | Whether accessible without enrollment |
| `is_active` | boolean | No | Whether visible to learners |

**Response:** `200 OK`

```json
{
  "lesson": {
    "id": 10,
    "course_module_id": 1,
    "title": "Updated Lesson Title",
    "description": "Learn how to identify and assess project risks",
    "content_type": "video",
    "content_url": "https://www.youtube.com/embed/updated123",
    "duration_minutes": 35,
    "sort_order": 3,
    "is_preview": false,
    "is_active": false,
    "created_at": "2026-04-14T12:00:00.000000Z",
    "updated_at": "2026-04-14T13:00:00.000000Z"
  }
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `404` | `{"message": "No query results for model [CourseLesson]"}` | Lesson not found |
| `422` | `{"message": "...", "errors": {...}}` | Validation failed |

---

### 8.11 Delete Lesson

Delete a lesson permanently.

**Endpoint:** `DELETE /lms/admin/lessons/{lessonId}`

**Auth:** Sanctum + Admin

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `lessonId` | integer | Lesson ID |

**Response:** `204 No Content`

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `404` | `{"message": "No query results for model [CourseLesson]"}` | Lesson not found |

**Warning:** Also deletes learner progress records for this lesson.

---

### 8.12 Reorder Lessons

Bulk update sort_order for multiple lessons.

**Endpoint:** `PUT /lms/admin/lessons/reorder`

**Auth:** Sanctum + Admin

**Request Body:**

```json
{
  "order": [
    { "id": 5, "sort_order": 1 },
    { "id": 3, "sort_order": 2 },
    { "id": 1, "sort_order": 3 }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `order` | array | Yes | Array of objects with `id` and `sort_order` |
| `order[].id` | integer | Yes | Lesson ID (must exist in `course_lessons`) |
| `order[].sort_order` | integer | Yes | New sort position |

**Response:** `200 OK`

```json
{
  "message": "Lessons reordered"
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `422` | `{"message": "...", "errors": {...}}` | Validation failed |

---

## 9. Admin APIs -- Assessments

Base path: `/api/v2/lms/admin`

---

### 9.1 List Assessments

Returns all assessments with optional filtering.

**Endpoint:** `GET /lms/admin/assessments`

**Auth:** Sanctum + Admin

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `course_id` | integer | No | Filter by course |
| `type` | string | No | Filter by assessment type (e.g., `quiz`, `mock_test`) |

**Response:** `200 OK`

```json
{
  "assessments": [
    {
      "id": 1,
      "course_id": 1,
      "course_module_id": 1,
      "title": "PMP Module 1 Quiz",
      "type": "quiz",
      "time_limit_minutes": 30,
      "passing_percentage": "70.00",
      "max_attempts": 3,
      "question_count": 20,
      "is_randomized": true,
      "sort_order": 1,
      "is_active": true,
      "created_at": "2026-04-14T10:00:00.000000Z",
      "updated_at": "2026-04-14T10:00:00.000000Z",
      "course": {
        "id": 1,
        "name": "PMP Certification Training"
      },
      "module": {
        "id": 1,
        "title": "People Domain"
      },
      "questions_count": 20
    }
  ]
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |

**Notes:**
- Sorted by `created_at` descending
- `questions_count` is a count of related questions (may differ from `question_count` if some questions are inactive)

---

### 9.2 Create Assessment

Create a new assessment for a course.

**Endpoint:** `POST /lms/admin/assessments`

**Auth:** Sanctum + Admin

**Request Body:**

```json
{
  "course_id": 1,
  "course_module_id": 1,
  "title": "Module 1 Quiz",
  "type": "quiz",
  "time_limit_minutes": 30,
  "passing_percentage": 70,
  "max_attempts": 3,
  "question_count": 0,
  "is_randomized": true,
  "sort_order": 1,
  "is_active": true
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `course_id` | integer | Yes | -- | Course ID (must exist in `courses`) |
| `course_module_id` | integer | No | `null` | Module ID (must exist in `course_modules`). Null for course-level assessments. |
| `title` | string | Yes | -- | Assessment title (max 255) |
| `type` | string | Yes | -- | Assessment type (max 50), e.g., `quiz`, `mock_test` |
| `time_limit_minutes` | integer | No | `null` | Time limit in minutes (min 1). Null for untimed. |
| `passing_percentage` | decimal | No | `0` | Minimum percentage to pass (0-100) |
| `max_attempts` | integer | No | `null` | Max allowed attempts (min 1). Null for unlimited. |
| `question_count` | integer | No | `0` | Number of active questions (auto-updated when questions are added) |
| `is_randomized` | boolean | No | `false` | Whether to randomize question order |
| `sort_order` | integer | No | `0` | Display order |
| `is_active` | boolean | No | `true` | Whether assessment is visible to learners |

**Response:** `201 Created`

```json
{
  "assessment": {
    "id": 3,
    "course_id": 1,
    "course_module_id": 1,
    "title": "Module 1 Quiz",
    "type": "quiz",
    "time_limit_minutes": 30,
    "passing_percentage": "70.00",
    "max_attempts": 3,
    "question_count": 0,
    "is_randomized": true,
    "sort_order": 1,
    "is_active": true,
    "created_at": "2026-04-14T12:00:00.000000Z",
    "updated_at": "2026-04-14T12:00:00.000000Z"
  }
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `422` | `{"message": "...", "errors": {...}}` | Validation failed |

---

### 9.3 Update Assessment

Update an existing assessment.

**Endpoint:** `PUT /lms/admin/assessments/{assessmentId}`

**Auth:** Sanctum + Admin

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `assessmentId` | integer | Assessment ID |

**Request Body:** (all fields optional)

```json
{
  "title": "Updated Quiz Title",
  "passing_percentage": 75,
  "is_active": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | No | Assessment title (max 255) |
| `type` | string | No | Assessment type (max 50) |
| `time_limit_minutes` | integer | No | Time limit in minutes (min 1) |
| `passing_percentage` | decimal | No | Minimum percentage to pass (0-100) |
| `max_attempts` | integer | No | Max allowed attempts (min 1) |
| `question_count` | integer | No | Number of active questions |
| `is_randomized` | boolean | No | Whether to randomize question order |
| `sort_order` | integer | No | Display order |
| `is_active` | boolean | No | Whether visible to learners |

**Response:** `200 OK`

```json
{
  "assessment": {
    "id": 3,
    "course_id": 1,
    "course_module_id": 1,
    "title": "Updated Quiz Title",
    "type": "quiz",
    "time_limit_minutes": 30,
    "passing_percentage": "75.00",
    "max_attempts": 3,
    "question_count": 0,
    "is_randomized": true,
    "sort_order": 1,
    "is_active": false,
    "created_at": "2026-04-14T12:00:00.000000Z",
    "updated_at": "2026-04-14T13:00:00.000000Z"
  }
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `404` | `{"message": "No query results for model [Assessment]"}` | Assessment not found |
| `422` | `{"message": "...", "errors": {...}}` | Validation failed |

---

### 9.4 Delete Assessment

Delete an assessment and all its questions.

**Endpoint:** `DELETE /lms/admin/assessments/{assessmentId}`

**Auth:** Sanctum + Admin

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `assessmentId` | integer | Assessment ID |

**Response:** `204 No Content`

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `404` | `{"message": "No query results for model [Assessment]"}` | Assessment not found |

**Warning:** This permanently deletes the assessment, all its questions, and all attempt records.

---

### 9.5 List Questions

Returns all questions for an assessment, ordered by sort_order.

**Endpoint:** `GET /lms/admin/assessments/{assessmentId}/questions`

**Auth:** Sanctum + Admin

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `assessmentId` | integer | Assessment ID |

**Response:** `200 OK`

```json
{
  "questions": [
    {
      "id": 1,
      "assessment_id": 1,
      "question_text": "What is the primary role of a project manager in conflict resolution?",
      "question_type": "mcq",
      "options": [
        "Avoid the conflict",
        "Facilitate resolution between parties",
        "Escalate to senior management",
        "Ignore the conflict"
      ],
      "correct_answer": "Facilitate resolution between parties",
      "explanation": "The PM should facilitate resolution by helping parties communicate and find common ground.",
      "sort_order": 1,
      "is_active": true,
      "created_at": "2026-04-14T10:00:00.000000Z",
      "updated_at": "2026-04-14T10:00:00.000000Z"
    }
  ]
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `404` | `{"message": "No query results for model [Assessment]"}` | Assessment not found |

---

### 9.6 Create Question

Add a new question to an assessment. Automatically updates the assessment's `question_count`.

**Endpoint:** `POST /lms/admin/assessments/{assessmentId}/questions`

**Auth:** Sanctum + Admin

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `assessmentId` | integer | Assessment ID |

**Request Body:**

```json
{
  "question_text": "What is the primary role of a project manager in conflict resolution?",
  "question_type": "mcq",
  "options": [
    "Avoid the conflict",
    "Facilitate resolution between parties",
    "Escalate to senior management",
    "Ignore the conflict"
  ],
  "correct_answer": "Facilitate resolution between parties",
  "explanation": "The PM should facilitate resolution by helping parties communicate.",
  "sort_order": 1,
  "is_active": true
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `question_text` | string | Yes | -- | The question text |
| `question_type` | string | No | `"mcq"` | Question type (max 50), e.g., `mcq`, `true_false` |
| `options` | array | Yes | -- | Array of answer options (min 2 items) |
| `options[]` | string | Yes | -- | Each option text |
| `correct_answer` | string | Yes | -- | The correct answer (must match one of the options) |
| `explanation` | string | No | `null` | Explanation shown during review |
| `sort_order` | integer | No | `0` | Display order |
| `is_active` | boolean | No | `true` | Whether question is included in assessments |

**Response:** `201 Created`

```json
{
  "question": {
    "id": 15,
    "assessment_id": 1,
    "question_text": "What is the primary role of a project manager in conflict resolution?",
    "question_type": "mcq",
    "options": ["Avoid the conflict", "Facilitate resolution between parties", "Escalate to senior management", "Ignore the conflict"],
    "correct_answer": "Facilitate resolution between parties",
    "explanation": "The PM should facilitate resolution by helping parties communicate.",
    "sort_order": 1,
    "is_active": true,
    "created_at": "2026-04-14T12:00:00.000000Z",
    "updated_at": "2026-04-14T12:00:00.000000Z"
  }
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `404` | `{"message": "No query results for model [Assessment]"}` | Assessment not found |
| `422` | `{"message": "...", "errors": {...}}` | Validation failed |

**Notes:**
- The assessment's `question_count` is automatically recalculated after creation (counts active questions only)

---

### 9.7 Update Question

Update an existing question.

**Endpoint:** `PUT /lms/admin/questions/{questionId}`

**Auth:** Sanctum + Admin

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `questionId` | integer | Question ID |

**Request Body:** (all fields optional)

```json
{
  "question_text": "Updated question text?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_answer": "Option B",
  "is_active": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `question_text` | string | No | The question text |
| `question_type` | string | No | Question type (max 50) |
| `options` | array | No | Array of answer options (min 2 items) |
| `correct_answer` | string | No | The correct answer |
| `explanation` | string | No | Explanation shown during review |
| `sort_order` | integer | No | Display order |
| `is_active` | boolean | No | Whether question is included |

**Response:** `200 OK`

```json
{
  "question": {
    "id": 15,
    "assessment_id": 1,
    "question_text": "Updated question text?",
    "question_type": "mcq",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option B",
    "explanation": "The PM should facilitate resolution by helping parties communicate.",
    "sort_order": 1,
    "is_active": false,
    "created_at": "2026-04-14T12:00:00.000000Z",
    "updated_at": "2026-04-14T13:00:00.000000Z"
  }
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `404` | `{"message": "No query results for model [AssessmentQuestion]"}` | Question not found |
| `422` | `{"message": "...", "errors": {...}}` | Validation failed |

**Notes:**
- If `is_active` is changed, the parent assessment's `question_count` is automatically recalculated

---

### 9.8 Delete Question

Delete a question permanently. Automatically updates the assessment's `question_count`.

**Endpoint:** `DELETE /lms/admin/questions/{questionId}`

**Auth:** Sanctum + Admin

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `questionId` | integer | Question ID |

**Response:** `204 No Content`

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `404` | `{"message": "No query results for model [AssessmentQuestion]"}` | Question not found |

---

### 9.9 Bulk Import Questions

Import multiple questions at once. Automatically assigns sequential sort_order values.

**Endpoint:** `POST /lms/admin/assessments/{assessmentId}/questions/bulk`

**Auth:** Sanctum + Admin

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `assessmentId` | integer | Assessment ID |

**Request Body:**

```json
{
  "questions": [
    {
      "question_text": "What does PMBOK stand for?",
      "question_type": "mcq",
      "options": [
        "Project Management Body of Knowledge",
        "Project Management Board of Knowledge",
        "Program Management Body of Knowledge",
        "Project Methods Body of Knowledge"
      ],
      "correct_answer": "Project Management Body of Knowledge",
      "explanation": "PMBOK stands for Project Management Body of Knowledge."
    },
    {
      "question_text": "Is risk management a continuous process?",
      "question_type": "true_false",
      "options": ["True", "False"],
      "correct_answer": "True",
      "explanation": null
    }
  ]
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `questions` | array | Yes | -- | Array of question objects (min 1) |
| `questions[].question_text` | string | Yes | -- | The question text |
| `questions[].question_type` | string | No | `"mcq"` | Question type (max 50) |
| `questions[].options` | array | Yes | -- | Array of answer options (min 2 items) |
| `questions[].correct_answer` | string | Yes | -- | The correct answer |
| `questions[].explanation` | string | No | `null` | Explanation shown during review |

**Response:** `201 Created`

```json
{
  "message": "2 questions imported",
  "questions": [
    {
      "id": 20,
      "assessment_id": 1,
      "question_text": "What does PMBOK stand for?",
      "question_type": "mcq",
      "options": ["Project Management Body of Knowledge", "Project Management Board of Knowledge", "Program Management Body of Knowledge", "Project Methods Body of Knowledge"],
      "correct_answer": "Project Management Body of Knowledge",
      "explanation": "PMBOK stands for Project Management Body of Knowledge.",
      "sort_order": 21,
      "is_active": true,
      "created_at": "2026-04-14T12:00:00.000000Z",
      "updated_at": "2026-04-14T12:00:00.000000Z"
    },
    {
      "id": 21,
      "assessment_id": 1,
      "question_text": "Is risk management a continuous process?",
      "question_type": "true_false",
      "options": ["True", "False"],
      "correct_answer": "True",
      "explanation": null,
      "sort_order": 22,
      "is_active": true,
      "created_at": "2026-04-14T12:00:00.000000Z",
      "updated_at": "2026-04-14T12:00:00.000000Z"
    }
  ]
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `404` | `{"message": "No query results for model [Assessment]"}` | Assessment not found |
| `422` | `{"message": "...", "errors": {...}}` | Validation failed |

**Notes:**
- `sort_order` is automatically assigned starting from the current maximum + 1
- All imported questions are set to `is_active: true` by default
- The assessment's `question_count` is recalculated after the import

---

## 10. Admin APIs -- Certificates

Base path: `/api/v2/lms/admin`

---

### 10.1 List All Certificates

Returns all certificates with optional filtering by status, course, or user.

**Endpoint:** `GET /lms/admin/certificates`

**Auth:** Sanctum + Admin

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status (`issued`, `revoked`) |
| `course_id` | integer | No | Filter by course |
| `user_id` | integer | No | Filter by user |

**Response:** `200 OK`

```json
{
  "certificates": [
    {
      "id": 1,
      "user_id": 1,
      "course_id": 1,
      "certificate_number": "CERT-2026-0001",
      "status": "issued",
      "issued_at": "2026-04-14T10:00:00.000000Z",
      "pdf_url": "https://s3.amazonaws.com/bucket/certificates/cert-001.pdf",
      "created_at": "2026-04-14T10:00:00.000000Z",
      "updated_at": "2026-04-14T10:00:00.000000Z",
      "course": {
        "id": 1,
        "name": "PMP Certification Training"
      },
      "user": {
        "id": 1,
        "first_name": "John",
        "last_name": "Doe",
        "email": "learner@example.com"
      }
    }
  ]
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |

**Notes:**
- Sorted by `created_at` descending
- Includes related course and user data

---

### 10.2 Issue Certificate

Manually issue a certificate for an enrollment. Bypasses eligibility checks (admin override).

**Endpoint:** `POST /lms/admin/certificates/{enrollmentId}/issue`

**Auth:** Sanctum + Admin

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `enrollmentId` | integer | Enrollment ID |

**Request Body:** None

**Response:** `201 Created`

```json
{
  "certificate": {
    "id": 5,
    "user_id": 1,
    "course_id": 1,
    "certificate_number": "CERT-2026-0005",
    "status": "issued",
    "issued_at": "2026-04-14T12:00:00.000000Z",
    "pdf_url": "https://s3.amazonaws.com/bucket/certificates/cert-005.pdf",
    "created_at": "2026-04-14T12:00:00.000000Z",
    "updated_at": "2026-04-14T12:00:00.000000Z"
  }
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `404` | `{"message": "No query results for model [LmsEnrollment]"}` | Enrollment not found |

**Notes:**
- Unlike the learner endpoint (5.2), this does not check eligibility -- the admin can issue a certificate for any enrollment regardless of completion status

---

### 10.3 Revoke Certificate

Revoke an issued certificate. Changes the status to `revoked`.

**Endpoint:** `POST /lms/admin/certificates/{certificateId}/revoke`

**Auth:** Sanctum + Admin

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `certificateId` | integer | Certificate ID |

**Request Body:** None

**Response:** `200 OK`

```json
{
  "certificate": {
    "id": 5,
    "user_id": 1,
    "course_id": 1,
    "certificate_number": "CERT-2026-0005",
    "status": "revoked",
    "issued_at": "2026-04-14T12:00:00.000000Z",
    "pdf_url": "https://s3.amazonaws.com/bucket/certificates/cert-005.pdf",
    "created_at": "2026-04-14T12:00:00.000000Z",
    "updated_at": "2026-04-14T14:00:00.000000Z"
  }
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `404` | `{"message": "No query results for model [Certificate]"}` | Certificate not found |

**Notes:**
- Revoked certificates will no longer be downloadable via the learner download endpoint (5.3)

---

### 10.4 List Certificate Templates

Returns all certificate templates.

**Endpoint:** `GET /lms/admin/certificate-templates`

**Auth:** Sanctum + Admin

**Response:** `200 OK`

```json
{
  "templates": [
    {
      "id": 1,
      "course_id": null,
      "name": "Default Certificate Template",
      "template_html": "<div class=\"certificate\">...</div>",
      "is_default": true,
      "is_active": true,
      "created_at": "2026-04-14T10:00:00.000000Z",
      "updated_at": "2026-04-14T10:00:00.000000Z",
      "course": null
    },
    {
      "id": 2,
      "course_id": 1,
      "name": "PMP Certificate Template",
      "template_html": "<div class=\"certificate pmp\">...</div>",
      "is_default": false,
      "is_active": true,
      "created_at": "2026-04-14T10:00:00.000000Z",
      "updated_at": "2026-04-14T10:00:00.000000Z",
      "course": {
        "id": 1,
        "name": "PMP Certification Training"
      }
    }
  ]
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |

**Notes:**
- Templates with `course_id: null` are global (used as fallback for any course)
- Templates with a specific `course_id` take precedence for that course

---

### 10.5 Create Certificate Template

Create a new certificate template.

**Endpoint:** `POST /lms/admin/certificate-templates`

**Auth:** Sanctum + Admin

**Request Body:**

```json
{
  "course_id": null,
  "name": "Default Certificate Template",
  "template_html": "<div class=\"certificate\"><h1>{{learner_name}}</h1><p>{{course_name}}</p><p>{{date}}</p></div>",
  "is_default": true,
  "is_active": true
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `course_id` | integer | No | `null` | Course ID. Null for a global template. |
| `name` | string | Yes | -- | Template name (max 255) |
| `template_html` | string | Yes | -- | HTML template body with placeholders |
| `is_default` | boolean | No | `false` | Whether this is the default template |
| `is_active` | boolean | No | `true` | Whether this template is available for use |

**Response:** `201 Created`

```json
{
  "template": {
    "id": 3,
    "course_id": null,
    "name": "Default Certificate Template",
    "template_html": "<div class=\"certificate\"><h1>{{learner_name}}</h1>...</div>",
    "is_default": true,
    "is_active": true,
    "created_at": "2026-04-14T12:00:00.000000Z",
    "updated_at": "2026-04-14T12:00:00.000000Z"
  }
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `422` | `{"message": "...", "errors": {...}}` | Validation failed |

---

### 10.6 Update Certificate Template

Update an existing certificate template.

**Endpoint:** `PUT /lms/admin/certificate-templates/{templateId}`

**Auth:** Sanctum + Admin

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `templateId` | integer | Template ID |

**Request Body:** (all fields optional)

```json
{
  "name": "Updated Template Name",
  "template_html": "<div class=\"certificate updated\">...</div>",
  "is_active": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `course_id` | integer | No | Course ID (null for global) |
| `name` | string | No | Template name (max 255) |
| `template_html` | string | No | HTML template body |
| `is_default` | boolean | No | Whether this is the default template |
| `is_active` | boolean | No | Whether available for use |

**Response:** `200 OK`

```json
{
  "template": {
    "id": 3,
    "course_id": null,
    "name": "Updated Template Name",
    "template_html": "<div class=\"certificate updated\">...</div>",
    "is_default": true,
    "is_active": false,
    "created_at": "2026-04-14T12:00:00.000000Z",
    "updated_at": "2026-04-14T13:00:00.000000Z"
  }
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `404` | `{"message": "No query results for model [CertificateTemplate]"}` | Template not found |
| `422` | `{"message": "...", "errors": {...}}` | Validation failed |

---

## 11. Admin APIs -- Learning Paths

Base path: `/api/v2/lms/admin`

---

### 11.1 List Learning Paths

Returns all learning paths with course counts.

**Endpoint:** `GET /lms/admin/learning-paths`

**Auth:** Sanctum + Admin

**Response:** `200 OK`

```json
{
  "learning_paths": [
    {
      "id": 1,
      "name": "Project Management Career Path",
      "slug": "project-management-career-path",
      "description": "A structured learning journey from PMP to PgMP",
      "sort_order": 1,
      "is_active": true,
      "created_at": "2026-04-14T10:00:00.000000Z",
      "updated_at": "2026-04-14T10:00:00.000000Z",
      "courses_count": 5
    }
  ]
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |

**Notes:**
- Sorted by `sort_order` ascending

---

### 11.2 Create Learning Path

Create a new learning path.

**Endpoint:** `POST /lms/admin/learning-paths`

**Auth:** Sanctum + Admin

**Request Body:**

```json
{
  "name": "Project Management Career Path",
  "slug": "project-management-career-path",
  "description": "A structured learning journey from PMP to PgMP",
  "sort_order": 1,
  "is_active": true
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | string | Yes | -- | Learning path name (max 255) |
| `slug` | string | Yes | -- | URL slug (max 255, must be unique) |
| `description` | string | No | `null` | Description text |
| `sort_order` | integer | No | `0` | Display order |
| `is_active` | boolean | No | `true` | Whether learning path is active |

**Response:** `201 Created`

```json
{
  "learning_path": {
    "id": 2,
    "name": "Project Management Career Path",
    "slug": "project-management-career-path",
    "description": "A structured learning journey from PMP to PgMP",
    "sort_order": 1,
    "is_active": true,
    "created_at": "2026-04-14T12:00:00.000000Z",
    "updated_at": "2026-04-14T12:00:00.000000Z"
  }
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `422` | `{"message": "...", "errors": {"slug": ["The slug has already been taken."]}}` | Duplicate slug or validation error |

---

### 11.3 Update Learning Path

Update an existing learning path.

**Endpoint:** `PUT /lms/admin/learning-paths/{learningPathId}`

**Auth:** Sanctum + Admin

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `learningPathId` | integer | Learning Path ID |

**Request Body:** (all fields optional)

```json
{
  "name": "Updated Path Name",
  "description": "Updated description",
  "is_active": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Learning path name (max 255) |
| `slug` | string | No | URL slug (max 255, must be unique excluding current record) |
| `description` | string | No | Description text |
| `sort_order` | integer | No | Display order |
| `is_active` | boolean | No | Whether learning path is active |

**Response:** `200 OK`

```json
{
  "learning_path": {
    "id": 2,
    "name": "Updated Path Name",
    "slug": "project-management-career-path",
    "description": "Updated description",
    "sort_order": 1,
    "is_active": false,
    "created_at": "2026-04-14T12:00:00.000000Z",
    "updated_at": "2026-04-14T13:00:00.000000Z"
  }
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `404` | `{"message": "No query results for model [LearningPath]"}` | Learning path not found |
| `422` | `{"message": "...", "errors": {...}}` | Validation failed |

---

### 11.4 Delete Learning Path

Delete a learning path and its course associations.

**Endpoint:** `DELETE /lms/admin/learning-paths/{learningPathId}`

**Auth:** Sanctum + Admin

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `learningPathId` | integer | Learning Path ID |

**Response:** `200 OK`

```json
{
  "message": "Learning path deleted"
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `404` | `{"message": "No query results for model [LearningPath]"}` | Learning path not found |

**Notes:**
- Deleting a learning path removes the associations with courses but does not delete the courses themselves

---

### 11.5 Sync Courses to Learning Path

Replace all course associations for a learning path. Uses a sync operation (removes existing, adds new).

**Endpoint:** `PUT /lms/admin/learning-paths/{learningPathId}/courses`

**Auth:** Sanctum + Admin

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `learningPathId` | integer | Learning Path ID |

**Request Body:**

```json
{
  "courses": [
    { "course_id": 1, "sort_order": 1, "level": "foundation" },
    { "course_id": 3, "sort_order": 2, "level": "intermediate" },
    { "course_id": 5, "sort_order": 3, "level": "advanced" }
  ]
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `courses` | array | Yes | -- | Array of course association objects |
| `courses[].course_id` | integer | Yes | -- | Course ID (must exist in `courses`) |
| `courses[].sort_order` | integer | No | `0` | Display order within the learning path |
| `courses[].level` | string | No | `"foundation"` | Course level: `foundation`, `intermediate`, or `advanced` |

**Response:** `200 OK`

```json
{
  "learning_path": {
    "id": 2,
    "name": "Project Management Career Path",
    "slug": "project-management-career-path",
    "description": "A structured learning journey from PMP to PgMP",
    "sort_order": 1,
    "is_active": true,
    "created_at": "2026-04-14T12:00:00.000000Z",
    "updated_at": "2026-04-14T12:00:00.000000Z",
    "courses": [
      {
        "id": 1,
        "name": "PMP Certification Training",
        "pivot": {
          "learning_path_id": 2,
          "course_id": 1,
          "sort_order": 1,
          "level": "foundation"
        }
      },
      {
        "id": 3,
        "name": "PgMP Certification Training",
        "pivot": {
          "learning_path_id": 2,
          "course_id": 3,
          "sort_order": 2,
          "level": "intermediate"
        }
      }
    ]
  }
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `404` | `{"message": "No query results for model [LearningPath]"}` | Learning path not found |
| `422` | `{"message": "...", "errors": {...}}` | Validation failed (e.g., invalid course_id, invalid level) |

**Notes:**
- This is a **sync** operation: any courses previously associated but not included in the request will be detached
- To add courses without removing existing ones, include all existing course IDs in the request along with the new ones

---

## 12. Admin APIs -- Support Tickets

Base path: `/api/v2/lms/admin`

---

### 12.1 List All Tickets

Returns all support tickets with optional filtering. Includes user info and message counts.

**Endpoint:** `GET /lms/admin/tickets`

**Auth:** Sanctum + Admin

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status (e.g., `open`, `in_progress`, `resolved`, `closed`) |
| `priority` | string | No | Filter by priority (e.g., `low`, `medium`, `high`, `urgent`) |
| `assigned_to` | integer | No | Filter by assigned admin user ID |
| `category` | string | No | Filter by category (e.g., `technical`, `billing`, `content`, `account`) |

**Response:** `200 OK`

```json
{
  "tickets": [
    {
      "id": 1,
      "user_id": 1,
      "category": "technical",
      "subject": "Video not loading in Module 3",
      "priority": "medium",
      "status": "open",
      "order_id": null,
      "course_id": 1,
      "assigned_to": null,
      "resolved_at": null,
      "created_at": "2026-04-14T08:00:00.000000Z",
      "updated_at": "2026-04-14T10:00:00.000000Z",
      "user": {
        "id": 1,
        "first_name": "John",
        "last_name": "Doe",
        "email": "learner@example.com"
      },
      "messages_count": 3
    }
  ]
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |

**Notes:**
- Sorted by `created_at` descending
- Multiple filters can be combined (e.g., `?status=open&priority=high`)

---

### 12.2 Get Ticket Detail

Returns a ticket with all messages, user info, and assignee info.

**Endpoint:** `GET /lms/admin/tickets/{ticketId}`

**Auth:** Sanctum + Admin

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `ticketId` | integer | Ticket ID |

**Response:** `200 OK`

```json
{
  "ticket": {
    "id": 1,
    "user_id": 1,
    "category": "technical",
    "subject": "Video not loading in Module 3",
    "priority": "medium",
    "status": "in_progress",
    "order_id": null,
    "course_id": 1,
    "assigned_to": 10,
    "resolved_at": null,
    "created_at": "2026-04-14T08:00:00.000000Z",
    "updated_at": "2026-04-14T10:00:00.000000Z",
    "user": {
      "id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "email": "learner@example.com"
    },
    "assignee": {
      "id": 10,
      "first_name": "Admin",
      "last_name": "User",
      "email": "admin@invensislearning.com"
    },
    "messages": [
      {
        "id": 1,
        "support_ticket_id": 1,
        "user_id": 1,
        "message": "I keep getting a 403 error...",
        "is_admin": false,
        "created_at": "2026-04-14T08:00:00.000000Z",
        "user": {
          "id": 1,
          "first_name": "John",
          "last_name": "Doe",
          "email": "learner@example.com"
        }
      }
    ]
  }
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `404` | `{"message": "No query results for model [SupportTicket]"}` | Ticket not found |

**Notes:**
- Unlike the learner detail endpoint (7.3), this includes the `assignee` relationship

---

### 12.3 Update Ticket

Update a ticket's status, priority, or assignment.

**Endpoint:** `PUT /lms/admin/tickets/{ticketId}`

**Auth:** Sanctum + Admin

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `ticketId` | integer | Ticket ID |

**Request Body:** (all fields optional)

```json
{
  "status": "resolved",
  "priority": "high",
  "assigned_to": 10
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | No | Ticket status (max 50), e.g., `open`, `in_progress`, `resolved`, `closed` |
| `priority` | string | No | Ticket priority (max 50), e.g., `low`, `medium`, `high`, `urgent` |
| `assigned_to` | integer | No | Admin user ID to assign (must exist in `users`). Set to `null` to unassign. |

**Response:** `200 OK`

```json
{
  "ticket": {
    "id": 1,
    "user_id": 1,
    "category": "technical",
    "subject": "Video not loading in Module 3",
    "priority": "high",
    "status": "resolved",
    "order_id": null,
    "course_id": 1,
    "assigned_to": 10,
    "resolved_at": "2026-04-14T14:00:00.000000Z",
    "created_at": "2026-04-14T08:00:00.000000Z",
    "updated_at": "2026-04-14T14:00:00.000000Z"
  }
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `404` | `{"message": "No query results for model [SupportTicket]"}` | Ticket not found |
| `422` | `{"message": "...", "errors": {...}}` | Validation failed |

**Notes:**
- Setting `status` to `resolved` automatically sets `resolved_at` to the current timestamp (only if not already resolved)
- Changing from `resolved` to another status does not clear `resolved_at`

---

### 12.4 Admin Reply to Ticket

Add an admin reply to a ticket. Sets `is_admin: true` on the message.

**Endpoint:** `POST /lms/admin/tickets/{ticketId}/messages`

**Auth:** Sanctum + Admin

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `ticketId` | integer | Ticket ID |

**Request Body:**

```json
{
  "user_id": 10,
  "message": "We've identified the issue and deployed a fix. Please try again."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user_id` | integer | Yes | Admin user ID (must exist in `users`) |
| `message` | string | Yes | Reply message body |

**Response:** `201 Created`

```json
{
  "message": {
    "id": 7,
    "support_ticket_id": 1,
    "user_id": 10,
    "message": "We've identified the issue and deployed a fix. Please try again.",
    "is_admin": true,
    "created_at": "2026-04-14T14:00:00.000000Z",
    "updated_at": "2026-04-14T14:00:00.000000Z"
  }
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `404` | `{"message": "No query results for model [SupportTicket]"}` | Ticket not found |
| `422` | `{"message": "...", "errors": {...}}` | Validation failed |

**Notes:**
- The key difference from the learner message endpoint (7.4) is that `is_admin` is set to `true`
- This allows the frontend to display admin and learner messages with different styling

---

## 13. Admin APIs -- Corporate Participants

Base path: `/api/v2/lms/admin`

---

### 13.1 List Corporate Participants

Returns all corporate participants with optional filtering.

**Endpoint:** `GET /lms/admin/corporate-participants`

**Auth:** Sanctum + Admin

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenant_id` | integer | No | Filter by tenant |
| `order_id` | integer | No | Filter by order |
| `status` | string | No | Filter by status (e.g., `invited`, `registered`, `active`) |

**Response:** `200 OK`

```json
{
  "participants": [
    {
      "id": 1,
      "tenant_id": 1,
      "first_name": "Jane",
      "last_name": "Smith",
      "email": "jane.smith@acmecorp.com",
      "phone": "+1-555-0101",
      "designation": "Senior Developer",
      "order_id": 5,
      "status": "invited",
      "invited_at": "2026-04-14T10:00:00.000000Z",
      "created_at": "2026-04-14T10:00:00.000000Z",
      "updated_at": "2026-04-14T10:00:00.000000Z"
    }
  ]
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |

**Notes:**
- Sorted by `created_at` descending

---

### 13.2 Create Corporate Participant

Create and invite a single corporate participant.

**Endpoint:** `POST /lms/admin/corporate-participants`

**Auth:** Sanctum + Admin

**Request Body:**

```json
{
  "tenant_id": 1,
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane.smith@acmecorp.com",
  "phone": "+1-555-0101",
  "designation": "Senior Developer",
  "order_id": 5
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tenant_id` | integer | Yes | Tenant ID (must exist in `tenants`) |
| `first_name` | string | Yes | First name (max 100) |
| `last_name` | string | Yes | Last name (max 100) |
| `email` | string | Yes | Email address (max 255) |
| `phone` | string | No | Phone number (max 50) |
| `designation` | string | No | Job title / designation (max 255) |
| `order_id` | integer | No | Associated order ID (must exist in `orders`) |

**Response:** `201 Created`

```json
{
  "participant": {
    "id": 2,
    "tenant_id": 1,
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane.smith@acmecorp.com",
    "phone": "+1-555-0101",
    "designation": "Senior Developer",
    "order_id": 5,
    "status": "invited",
    "invited_at": "2026-04-14T12:00:00.000000Z",
    "created_at": "2026-04-14T12:00:00.000000Z",
    "updated_at": "2026-04-14T12:00:00.000000Z"
  }
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `422` | `{"message": "...", "errors": {...}}` | Validation failed |

**Notes:**
- Status is automatically set to `invited` and `invited_at` is set to the current timestamp

---

### 13.3 Bulk Create Corporate Participants

Create and invite multiple corporate participants in a single request.

**Endpoint:** `POST /lms/admin/corporate-participants/bulk`

**Auth:** Sanctum + Admin

**Request Body:**

```json
{
  "participants": [
    {
      "tenant_id": 1,
      "first_name": "Jane",
      "last_name": "Smith",
      "email": "jane.smith@acmecorp.com",
      "phone": "+1-555-0101",
      "designation": "Senior Developer",
      "order_id": 5
    },
    {
      "tenant_id": 1,
      "first_name": "Bob",
      "last_name": "Johnson",
      "email": "bob.johnson@acmecorp.com",
      "phone": null,
      "designation": "Team Lead",
      "order_id": 5
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `participants` | array | Yes | Array of participant objects (min 1) |
| `participants[].tenant_id` | integer | Yes | Tenant ID (must exist in `tenants`) |
| `participants[].first_name` | string | Yes | First name (max 100) |
| `participants[].last_name` | string | Yes | Last name (max 100) |
| `participants[].email` | string | Yes | Email address (max 255) |
| `participants[].phone` | string | No | Phone number (max 50) |
| `participants[].designation` | string | No | Job title / designation (max 255) |
| `participants[].order_id` | integer | No | Associated order ID (must exist in `orders`) |

**Response:** `201 Created`

```json
{
  "message": "2 participants created",
  "participants": [
    {
      "id": 3,
      "tenant_id": 1,
      "first_name": "Jane",
      "last_name": "Smith",
      "email": "jane.smith@acmecorp.com",
      "phone": "+1-555-0101",
      "designation": "Senior Developer",
      "order_id": 5,
      "status": "invited",
      "invited_at": "2026-04-14T12:00:00.000000Z",
      "created_at": "2026-04-14T12:00:00.000000Z",
      "updated_at": "2026-04-14T12:00:00.000000Z"
    },
    {
      "id": 4,
      "tenant_id": 1,
      "first_name": "Bob",
      "last_name": "Johnson",
      "email": "bob.johnson@acmecorp.com",
      "phone": null,
      "designation": "Team Lead",
      "order_id": 5,
      "status": "invited",
      "invited_at": "2026-04-14T12:00:00.000000Z",
      "created_at": "2026-04-14T12:00:00.000000Z",
      "updated_at": "2026-04-14T12:00:00.000000Z"
    }
  ]
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `422` | `{"message": "...", "errors": {...}}` | Validation failed (any participant) |

**Notes:**
- All participants are created with status `invited` and `invited_at` set to the current timestamp
- If validation fails for any participant, none are created (validation happens before any inserts)

---

### 13.4 Update Corporate Participant

Update a corporate participant's details or status.

**Endpoint:** `PUT /lms/admin/corporate-participants/{participantId}`

**Auth:** Sanctum + Admin

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `participantId` | integer | Participant ID |

**Request Body:** (all fields optional)

```json
{
  "first_name": "Janet",
  "status": "registered"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `first_name` | string | No | First name (max 100) |
| `last_name` | string | No | Last name (max 100) |
| `email` | string | No | Email address (max 255) |
| `phone` | string | No | Phone number (max 50) |
| `designation` | string | No | Job title / designation (max 255) |
| `status` | string | No | Participant status (max 50), e.g., `invited`, `registered`, `active` |

**Response:** `200 OK`

```json
{
  "participant": {
    "id": 3,
    "tenant_id": 1,
    "first_name": "Janet",
    "last_name": "Smith",
    "email": "jane.smith@acmecorp.com",
    "phone": "+1-555-0101",
    "designation": "Senior Developer",
    "order_id": 5,
    "status": "registered",
    "invited_at": "2026-04-14T12:00:00.000000Z",
    "created_at": "2026-04-14T12:00:00.000000Z",
    "updated_at": "2026-04-14T14:00:00.000000Z"
  }
}
```

**Error Responses:**

| Status | Body | When |
|--------|------|------|
| `401` | `{"message": "Unauthenticated."}` | Missing or invalid token |
| `403` | `{"message": "Forbidden"}` | User does not have admin role |
| `404` | `{"message": "No query results for model [CorporateParticipant]"}` | Participant not found |
| `422` | `{"message": "...", "errors": {...}}` | Validation failed |

---

## 14. Data Models

### Enrollment Statuses

| Status | Description |
|--------|-------------|
| `active` | Learner has access and can consume content |
| `completed` | All lessons completed (auto-set when progress = 100%) |
| `suspended` | Admin suspended access |
| `expired` | Access period expired |

### Lesson Progress Statuses

| Status | Description |
|--------|-------------|
| `not_started` | Learner hasn't opened this lesson |
| `in_progress` | Learner opened but hasn't completed |
| `completed` | Learner marked as complete |

### Content Types

| Type | Description | content_url |
|------|-------------|-------------|
| `video` | Embedded video | YouTube/Vimeo embed URL |
| `pdf` | Document viewer | S3 or CDN URL to PDF file |
| `external` | External portal | Full URL to external system (PMI, PeopleCert) |
| `quiz` | Assessment | `null` (handled by assessment APIs in Section 4) |

### Assessment Types

| Type | Description |
|------|-------------|
| `quiz` | Module-level quiz with limited question count |
| `mock_test` | Full-length practice test (course-level) |

### Question Types

| Type | Description |
|------|-------------|
| `mcq` | Multiple choice question (single correct answer) |
| `true_false` | True/false question |

### Certificate Statuses

| Status | Description |
|--------|-------------|
| `issued` | Certificate is active and downloadable |
| `revoked` | Certificate has been revoked by admin |

### Ticket Statuses

| Status | Description |
|--------|-------------|
| `open` | Newly created, not yet addressed |
| `in_progress` | Being worked on by support team |
| `resolved` | Issue resolved (auto-sets `resolved_at`) |
| `closed` | Ticket closed (no further action) |

### Ticket Priorities

| Priority | Description |
|----------|-------------|
| `low` | Non-urgent, informational |
| `medium` | Default priority |
| `high` | Important, needs attention |
| `urgent` | Critical, immediate action required |

### Ticket Categories

| Category | Description |
|----------|-------------|
| `technical` | Platform/video/content access issues |
| `billing` | Payment, invoice, refund inquiries |
| `content` | Course content quality or errors |
| `account` | Account access, profile issues |

### Corporate Participant Statuses

| Status | Description |
|--------|-------------|
| `invited` | Invitation sent, not yet registered |
| `registered` | Participant created an account |
| `active` | Actively enrolled and learning |

### Learning Path Levels

| Level | Description |
|-------|-------------|
| `foundation` | Beginner-level course in the path |
| `intermediate` | Mid-level course in the path |
| `advanced` | Expert-level course in the path |

### User Roles

| Role Slug | Description | Token Abilities |
|-----------|-------------|----------------|
| `customer` | Regular learner | `lms:learner` |
| `lms_admin` | LMS admin user | `lms:learner`, `lms:admin` |
| `super_admin` | Super admin | `lms:learner`, `lms:admin` |

### Course Content Hierarchy

```
Course
 +-- Module (sort_order, is_active)
 |    +-- Lesson (sort_order, content_type, content_url, is_preview, is_active)
 |    |    +-- LearnerLessonProgress (status, started_at, completed_at, time_spent_seconds)
 |    +-- Assessment (type, time_limit_minutes, passing_percentage, max_attempts)
 |         +-- AssessmentQuestion (question_type, options, correct_answer)
 |         +-- AssessmentAttempt (score, percentage, is_passed, time_spent_seconds)
 |              +-- AttemptAnswer (selected_answer, is_correct)
 +-- Certificate (certificate_number, status, pdf_url)
 +-- LearningPath (many-to-many via pivot with sort_order, level)
```

---

## 15. Error Handling

All errors follow a consistent format:

### Unauthenticated (401)
```json
{
  "message": "Unauthenticated."
}
```

Returned when no `Authorization: Bearer <token>` header is provided, or the token is invalid/expired.

### Forbidden (403)
```json
{
  "message": "Forbidden"
}
```

Returned when the authenticated user does not have the required role/ability (e.g., a customer trying to access admin endpoints).

### Validation Error (422)
```json
{
  "message": "The title field is required.",
  "errors": {
    "title": ["The title field is required."]
  }
}
```

### Not Found (404)
```json
{
  "message": "No query results for model [App\\Models\\CourseLesson] 999."
}
```

### Bad Request (400)
```json
{
  "error": "Not eligible"
}
```

### Conflict (409)
```json
{
  "error": "Bookmark already exists"
}
```

### Server Error (500)
```json
{
  "message": "Server Error"
}
```

---

## 16. Authentication Guide

### Getting a Token

To authenticate, send a login request:

```bash
curl -X POST http://127.0.0.1:8000/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "learner@example.com", "password": "secretpassword"}'
```

The response includes a `token` field:

```json
{
  "token": "1|abc123def456...",
  "user": { ... }
}
```

### Using the Token

Include the token in all subsequent requests using the `Authorization` header:

```bash
curl -X GET http://127.0.0.1:8000/api/v2/lms/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 1|abc123def456..."
```

### Token Abilities

Tokens are scoped by role:

| Role | Abilities | Access |
|------|-----------|--------|
| `customer` | `lms:learner` | Learner endpoints only (Sections 2-7) |
| `lms_admin` / `super_admin` | `lms:learner`, `lms:admin` | All endpoints (Sections 2-13) |

### Alternative Authentication Methods

**Registration:**
```bash
curl -X POST http://127.0.0.1:8000/api/v2/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "newuser@example.com",
    "password": "secretpassword",
    "password_confirmation": "secretpassword"
  }'
```

**Google OAuth:**
```bash
curl -X POST http://127.0.0.1:8000/api/v2/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@gmail.com",
    "first_name": "John",
    "last_name": "Doe",
    "google_id": "118234567890123456789"
  }'
```

Both return a `token` in the same format as the login endpoint.

### Logging Out

Revoke the current token:

```bash
curl -X POST http://127.0.0.1:8000/api/v2/auth/logout \
  -H "Authorization: Bearer 1|abc123def456..."
```

### Checking Current User

Verify the token and get user info:

```bash
curl -X GET http://127.0.0.1:8000/api/v2/auth/me \
  -H "Authorization: Bearer 1|abc123def456..."
```

### Endpoint Authentication Summary

| Section | Auth Requirement | Middleware |
|---------|-----------------|------------|
| 1. Authentication (login, register, google) | Public | None |
| 1. Authentication (logout, me) | Sanctum | `auth:sanctum` |
| 2-7. Learner APIs | Sanctum | `auth:sanctum` |
| 8-13. Admin APIs | Sanctum + Admin | `auth:sanctum`, `lms.admin` |
