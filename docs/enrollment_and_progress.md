# Enrollment & Progress Module
## Endpoint 1: Enroll in a Course (Student Only)
Enrolls an authenticated student in a published course.
- **HTTP Method:** `POST`
- **URL:** `/api/v1/courses/:courseId/enroll`
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Access:** Private (Only Authenticated Students).
### Response: `210 Created` (Success)
```
{
  "status": "success",
  "data": {
    "enrollment": {
      "id": 1,
      "studentId": 3,
      "courseId": 1,
      "enrolledAt": "2026-08-04T15:00:00.000Z"
    }
  }
}
```
### Response: `400 Bad Request` (Client Error - Duplicate Enrollment)
```
{
  "status": "error",
  "message": "You are already enrolled in this course."
}
```
## Endpoint 2: Mark Lesson as Completed (Student Only)
Marks a specific lesson as complete for an enrolled student.
- **HTTP Method:** `POST`
- **URL:** `/api/v1/lessons/:lessonId/complete`
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Access:** Private (Only Authenticated Students who are actively enrolled in this course).
### Response: `200 OK` (Success)
```
{
  "status": "success",
  "data": {
    "progress": {
      "id": 1,
      "enrollmentId": 1,
      "lessonId": 1,
      "isCompleted": true,
      "completedAt": "2026-08-04T15:05:00.000Z"
    }
  }
}
```
### Response: `403 Forbidden` (Client Error - Not Enrolled)
```
{
  "status": "error",
  "message": "Access denied. You must be enrolled in this course to complete its lessons."
}
```
## Endpoint 3: Get Course Progress (Student Only)
Calculates and returns the student's completion percentage and a list of their completed lesson IDs.
- **HTTP Method:** `GET`
- **URL:** `/api/v1/courses/:courseId/progress`
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Access:** Private (Only Authenticated Students enrolled in this course).
### Response: `200 OK` (Success)
```
{
  "status": "success",
  "data": {
    "progressPercentage": 50.0,
    "totalLessons": 2,
    "completedLessonsCount": 1,
    "completedLessonIds": [1]
  }
}
```
