# API DESIGN SPECIFICATION

## Authentication Module

### Global Response Standards

- **Success Response Structure:**

```
{
    "status": "success",
    "data": { ... }  // Placed in a nested "data" wrapper
}
```

- **Error Response Structure:**

```
{
    "status": "error",
    "message": "A human-readable error message explaining what failed."
}
```

### Endpoint 1: User Registration

Allows new students or instructors to create an account on the platform.

- **HTTP method:** `POST`
- **URL:** `api/v1/auth/register`
- **Headers:** `Content-Type: application/json`

#### Request Body (JSON)

| Field Name | Data Type | Required | Description                                      |
| :--------: | :-------: | :------: | :----------------------------------------------- |
|   `name`   | `string`  |   Yes    | User's full name. Minimun of 2 characters.       |
|  `email`   | `string`  |   Yes    | Must be a valid email address format and unique. |
| `password` | `string`  |   Yes    | Security minimum of 8 characters.                |
|   `role`   | `string`  |   Yes    | Must be exactly `"STUDENT"` or `"INSTRUCTOR"`.   |

#### Response: `201 Created` (Success)

```
{
    "status": "success",
    "data": {
        "user": {
            "id": 1,
            "name": "Amina Udosen",
            "email": "amina@email.com",
            "role": "STUDENT",
            "createdAt": "2026-07-24T07:30:00.000Z",
            "updatedAt": "2026-07-24T07:30:00.000Z"
        },
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IlNUVURFTlQ..."
    }
}
```

#### Response: `400 Bad Request` (Client Error - Duplicate Email)

```
{
    "status": "error",
    "message": "An account with this email already exists."
}
```

#### Response: `422 Unprocessable Entity` (Client Error - Validation Failure)

```
{
    "status": "error",
    "message": "Password must be at least 8 characters long."
}
```

### Endpoint 2: User Login

Authenticates an existing user and returns a fresh JWT session token.

- **HTTP method:** `POST`
- **URL:** `/api/v1/auth/login`
- **Headers:** `Content-Type: application/json`

#### Request Body (JSON)

| Field Name | Data Type | Required | Description/Constraints        |
| :--------: | :-------: | :------: | :----------------------------- |
|  `email`   | `string`  |   Yes    | Must be a valid email address. |
| `password` | `string`  |   Yes    | User's password.               |

#### Response: `200 OK` (Success)

```
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "name": "Amina Udosen",
      "email": "amina@email.com",
      "role": "STUDENT",
      "createdAt": "2026-07-24T07:30:00.000Z",
      "updatedAt": "2026-07-24T07:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IlNUVURFTlQ..."
  }
}
```

#### Response: `401 Unauthorized` (Client Error - Invalid Credentials)

```
{
  "status": "error",
  "message": "Invalid email or password."
}
```

## Course Management Module

### Endpoint 1: Get All Courses (Public)

Retrieves a paginated list of published courses. Supports filtering by title and page number.

- **HTTP Method**: `GET`
- **URL:** `/api/v1/courses`
- **Query Parameters:**
  - `page` (optional, default: `1`): The page number.
  * `limit` (optional, default: `10`): Number of courses per page.
  * `search` (optional): Filter courses where the title contains this search string.
- **Access:** Public (Anyone can browse published courses).

#### Response: `200 OK` (Success)

```
{
  "status": "success",
  "data": {
    "courses": [
      {
        "id": 1,
        "title": "Introduction to Node.js & Express",
        "description": "Learn modern backend web development from scratch.",
        "price": "49.99",
        "thumbnailUrl": "https://cloudinary.com/image.jpg",
        "instructor": {
          "id": 2,
          "name": "Instructor Jane"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalCourses": 1,
      "totalPages": 1
    }
  }
}
```

### Endpoint 2: Get Course Syllabus (Public)

Retrieves a single course, including its modules and lessons sorted by their orderIndex.

- **HTTP Method:** `GET`
- **URL:** `/api/v1/courses/:id`
- **Access:** Public (Anyone can view a syllabus, but students cannot watch protected lesson videos until they are enrolled).

#### Response: `200 OK` (Success)

```
{
  "status": "success",
  "data": {
    "course": {
      "id": 1,
      "title": "Introduction to Node.js & Express",
      "description": "Learn modern backend web development from scratch.",
      "price": "49.99",
      "instructor": {
        "id": 2,
        "name": "Instructor Jane"
      },
      "modules": [
        {
          "id": 5,
          "title": "Module 1: Getting Started",
          "orderIndex": 1,
          "lessons": [
            {
              "id": 12,
              "title": "Lesson 1: Scaffolding Express",
              "orderIndex": 1,
              "videoUrl": null // Null if the viewer is not enrolled (handled in controller)
            }
          ]
        }
      ]
    }
  }
}
```

### Endpoint 3: Create Course Draft (Instructor Only)

Creates a new course in a draft state (`isPublished = false`).

- **HTTP Method:** `POST`
- **URL:** `/api/v1/courses`
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Access:** Private (Only Authenticated Instructors).

#### Request Body (JSON)

| Field Name     | Data Type | Required | Description / Constraints                 |
| :------------- | :-------: | :------: | :---------------------------------------- |
| `title`        | `string`  |   Yes    | Course title (min 5 characters).          |
| `description`  | `string`  |   Yes    | Course description (min 20 characters).   |
| `price`        | `number`  |    No    | Price of the course (defaults to `0.00`). |
| `thumbnailUrl` | `string`  |    No    | Cover image URL (from Cloudinary).        |

#### Response: `201 Created` (Success)

```
{
    "status": "success",
    "data": {
        "course": {
            "id": 2,
            "instructorId": 2,
           "title": "Advanced SQL Optimization",
            "description": "Master indexing, query parsing, and database performance.",
          "price": "99.99",
            "isPublished": false,
          "thumbnailUrl": null,
            "createdAt": "2026-08-03T17:15:00.000Z",
            "updatedAt": "2026-08-03T17:15:00.000Z"
        }
    }
}
```

#### Response: `403 Forbidden` (RBAC Failure)

```
{
    "status": "error",
    "message": "Access denied. Only INSTRUCTOR can perform this action."
}
```

### Endpoint 4: Update Course Metadata (Course Owner Only)

Updates the metadata of an existing course.

- **HTTP Method:** `PUT`
- **URL:** `/api/v1/courses/:id`
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Access:** Private (Only the Instructor who originally created this specific course).

#### Request Body (JSON)

- Accepts any partial fields: `title`, `description`, `price`, `thumbnailUrl`.

#### Response: `200 OK` (Success)

```
{
    "status": "success",
    "data": {
        "course": {
            "id": 2,
            "title": "Advanced SQL & Database Performance", // Updated
            "description": "Master indexing, query parsing, and database performance."
            // ... remaining fields
        }
    }
}
```

#### Response: `403 Forbidden` (Ownership Failure)

```
{
    "status": "error",
    "message": "Access denied. You do not own this course."
}
```
