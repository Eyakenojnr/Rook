# Curriculum Builder Module
## Endpoint 1: Create Module (Instructor / Course Owner Only)
Creates a new module (chapter) inside an instructor's course.
- **HTTP Method:** `POST`
- **URL:** `/api/v1/courses/:courseId/modules`
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Access:** Private (Only the Instructor who owns this specific course).
### Request Body (JSON)
| Field Name | Data Type | Required	| Description / Constraints |
| :- | :-: | :-: | :- |
| `title` | `string` | Yes | Title of the module (e.g., "Module 1: Getting Started"). |
| `orderIndex` | `integer` | Yes | The sequential position of the module (must be `>= 1`). |
### Response: `201 Created` (Success)
```
{
  "status": "success",
  "data": {
    "module": {
      "id": 1,
      "courseId": 2,
      "title": "Module 1: Getting Started",
      "orderIndex": 1,
      "createdAt": "2026-08-04T08:00:00.000Z",
      "updatedAt": "2026-08-04T08:00:00.000Z"
    }
  }
}
```
## Endpoint 2: Create Lesson (Instructor / Course Owner Only)
Creates a new lesson inside a module.
- **HTTP Method:** `POST`
- **URL:** `/api/v1/modules/:moduleId/lessons`
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Access:** Private (Only the Instructor who owns the course this module belongs to).
### Request Body (JSON)
| Field Name | Data Type | Required	| Description / Constraints |
| :- | :-: |:-:| :- |
| `title` | `string` | Yes | Title of the lesson. |
| `content`	| `string` | No	| Optional written text or markdown lecture notes. |
| `videoUrl` | `string`	| No | Optional Cloudinary URL to the lecture video. |
| `orderIndex` | `integer` | Yes | The sequential position of the lesson within the module (must be `>= 1`). |
### Response: `201 Created` (Success)
```
{
  "status": "success",
  "data": {
    "lesson": {
      "id": 1,
      "moduleId": 1,
      "title": "Lesson 1: Scaffolding Express",
      "content": "In this lesson, we will set up our directories...",
      "videoUrl": "https://cloudinary.com/video.mp4",
      "orderIndex": 1,
      "createdAt": "2026-08-04T08:15:00.000Z",
      "updatedAt": "2026-08-04T08:15:00.000Z"
    }
  }
}
```