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
