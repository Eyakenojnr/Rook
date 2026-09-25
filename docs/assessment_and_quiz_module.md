# Assessment & Quiz Module

## 1. Create Quiz for Lesson (Instructor / Course Owner Only)
* **HTTP Method:** `POST`
* **URL:** `/api/v1/lessons/:lessonId/quizzes`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Access:** Private (`INSTRUCTOR` who owns the parent course)
* **Request Body (JSON):**
  ```json
  {
    "title": "SQL Fundamentals Assessment"
  }
  ```
* **Response (201 Created):**
    ```json
    {
        "status": "success",
        "data": {
            "quiz": {
                "id": 1,
                "lessonId": 2,
                "title": "SQL Fundamentals Assessment",
                "createdAt": "2026-09-20T00:00:00.000Z"
            }
        }
    }
    ```
## 2. Add Question to Quiz (Instructor/Course Owner Only)
* **HTTP Method:** `POST`
* **URL:** `/api/v1/quizzes/:quizId/questions`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Access:** Private (`INSTRUCTOR` who owns the parent course)
* **Request Body (JSON):**
    ```json
    {
        "questionText": "Which SQL clause is used to filter records?",
        "options": ["ORDER BY", "WHERE", "GROUP BY", "SELECT"],
        "correctOptionIndex": 1
    }
    ```
* **Response (201 Created):**
    ```json
    {
        "status": "success",
        "data": {
            "question": {
                "id": 1,
                "quizId": 1,
                "questionText": "Which SQL clause is used to filter records?",
                "options": ["ORDER BY", "WHERE", "GROUP BY", "SELECT"],
                "correctOptionIndex": 1,
                "createdAt": "2026-09-20T00:00:00.000Z"
            }
        }
    }
    ```
## 3. Get Quiz for Lesson (Student / Instructor)
* **HTTP Method:** `GET`
* **URL:** `/api/v1/lessons/:lessonId/quiz`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Access:** Private (Enrolled `STUDENT` or course `INSTRUCTOR`)
* **Security Rule:** If requester is a `STUDENT`, `correctOptionIndex` is stripped from every question object.
* **Response (200 OK):**
    ```json
        {
            "status": "success",
            "data": {
                "quiz": {
                    "id": 1,
                    "title": "SQL Fundamentals Assessment",
                    "questions": [
                        {
                            "id": 1,
                            "questionText": "Which SQL clause is used to filter records?",
                            "options": ["ORDER BY", "WHERE", "GROUP BY", "SELECT"]
                        }
                    ]
                }
            }
        }
    ```
## 4. Submit Quiz Answers (Enrolled Student Only)
* **HTTP Method:** `POST`
* **URL:** `/api/v1/quizzes/:quizId/submit`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Access:** Private (Enrolled `STUDENT`)
* **Request Body (JSON):**
    ```json
    {
        "answers": [
            { "questionId": 1, "selectedOptionIndex": 1 }
        ]
    }
    ```
* **Response (200 OK):**
    ```json
    {
        "status": "success",
        "data": {
            "attempt": {
                "id": 1,
                "score": 100.00,
                "isPassed": true,
                "totalQuestions": 1,
                "correctCount": 1,
                "passingThreshold": 70.00,
                "attemptedAt": "2026-09-20T00:05:00.000Z"
            }
        }
    }
    ```