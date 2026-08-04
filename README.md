# Rook LMS API

A decoupled, production-grade RESTful API for a Learning Management System (LMS) designed to facilitate structured online education. Built using Node.js, Express, PostgreSQL, and Prisma 7, this system implements rigorous security standards, robust database constraints, and scalable business logic.

---

## Architectural Design & Standards

This project is built using a **Layered MVC-Service Architecture** to enforce separation of concerns, ensure high-speed testability, and maintain clean database interactions:

1. **Routing Layer (`src/routes`)**: Decoupled, versioned (`/api/v1`) URIs routing traffic to specific handlers.
2. **Controller Layer (`src/controllers`)**: Responsible strictly for HTTP lifecycle management—handling payloads, executing fail-early input validations, and formulating standardized JSON responses.
3. **Service Layer (`src/services`)**: Houses the core business rules and performs optimized database transactions. It remains completely decoupled from Express HTTP objects.
4. **Data Access Layer (`src/generated/prisma`)**: High-performance database queries executed via native JavaScript PostgreSQL drivers and Prisma 7 adapters.

### Key Engineering Implementations:
* **Custom Operational Error Handling (`AppError`)**: Antedates standard Node.js error propagation by associating HTTP status codes directly with service-layer exceptions, preventing unhandled server crashes and generic `500` server fallbacks.
* **Sequential Lesson Locking**: Protects progress integrity by preventing students from skipping ahead in a module; Lesson $N$ cannot be marked complete unless Lesson $N-1$ is verified complete in the database.
* **Database Mapping Decoupling**: Uses Prisma `@map` and `@@map` decorators to bridge JavaScript naming conventions (`camelCase`) and PostgreSQL naming standards (`snake_case`) cleanly.
* **"Soft" Authentication**: Used in public endpoints (like loading a course syllabus) to dynamically reveal private details (like lesson video links) only if the requesting user is verified as enrolled or the course instructor, without restricting public access.

---

## Tech Stack

* **Runtime:** Node.js (configured with native ES Modules)
* **Web Framework:** Express.js
* **Database Engine:** PostgreSQL
* **ORM:** Prisma 7 (using `@prisma/adapter-pg` driver adapters)
* **Security:** JSON Web Tokens (JWT) & bcryptjs (password hashing)
* **Logging:** Morgan

---

## Project Directory Structure

```
lms-api/
├── docs/
│   └── API.md              # Versioned API design contract
├── prisma/
│   ├── schema.prisma       # Prisma database models
│   └── migrations/         # Auto-generated SQL migration history
├── src/
│   ├── config/             # DB connection pool configuration
│   ├── controllers/        # Express controllers (handles req/res parsing)
│   ├── generated/          # Native JS Prisma Client output
│   ├── middlewares/        # Custom security guards (Auth, RBAC)
│   ├── routes/             # Nested and versioned routing definitions
│   ├── services/           # Core business logic (Prisma queries, calculations)
│   ├── utils/              # Application-wide utility classes (AppError)
│   ├── app.js              # Global Express middleware configuration
│   └── server.js           # App entry point (initiates DB and HTTP server)
├── .env                    # Local environment secrets (ignored by Git)
├── .gitignore              # Version control ignore lists
├── package.json            # Node.js dependencies and run scripts
└── README.md               # Project documentation
```

---

## Getting Started (Local Development)

### Prerequisites
* **Node.js** (v18+ recommended)
* **PostgreSQL** (Installed locally, via WSL, or cloud-hosted on Neon/Supabase)

### 1. Installation
Clone the repository and install the production and development dependencies:
```bash
git clone https://github.com/your-username/Rook.git
cd Rook
npm install
```

### 2. Database Provisioning & Environment Configuration
Create a `.env` file in the root directory:
```bash
touch .env
```
Populate the `.env` file with your environment configurations:
```env
PORT=5000
DATABASE_URL="postgresql://your_db_user:your_db_password@localhost:5432/your_db_name?schema=public"
JWT_SECRET="generate_a_long_random_and_secure_secret_string"
JWT_EXPIRES_IN="7d"
```

### 3. Generate Database Schema & Client
Apply the migration files to your local PostgreSQL instance and generate the custom JavaScript query client:
```bash
# Apply migrations to your database
npx prisma migrate dev

# Generate the custom JavaScript client
npx prisma generate
```

### 4. Running the Application
Start the development server with live reload enabled via Nodemon:
```bash
npm run dev
```
The server will establish a pool connection to PostgreSQL, execute a database health check, and begin listening for HTTP requests on `http://localhost:5000`.

---

## Completed Core Features

* **Role-Based Authentication (RBAC):** Register and Login endpoints utilizing bcrypt password hashing and signing secure JWT tokens with strict student vs. instructor role allocation.
* **Course Catalog Management:** Paginated, filtered, and optimized course lookups featuring case-insensitive PostgreSQL search indexing.
* **Nested Curriculum Builder:** Chronological Module and Lesson generation under courses utilizing single-query join optimizations.
* **Secure Enrollment Engine:** Student-exclusive course registration backed by composite primary database indexes.
* **Linear Progress Calculations:** Mathematically precise, non-blocking progress trackers utilizing concurrent SQL aggregations via `Promise.all`.

---

## Future Implementations & Roadmap

The following features represent planned enhancements to transform this core LMS engine into a fully commercialized application:

* **Automated PDF Certificate Generation:** Using `pdf-lib` to overlay dynamic student credentials and course titles over a pre-designed certificate template once progress reaches $100\%$, uploading the output to cloud storage.
* **Secure Payment Gateway Sandbox:** Integrating Stripe or Paystack sandbox checkout pipelines utilizing secure webhooks to automatically process course enrollments once a purchase clears.
* **Lesson Q&A Discussion Forum:** Enabling threaded nested commenting systems under individual lessons for students to ask questions and instructors to reply.
* **Video Streaming Optimizations:** Transitioning from raw video file links to optimized streaming infrastructure (using Cloudinary or AWS S3 signed URLs) to prevent unauthorized distribution of lecture videos.

---

## License

This project is licensed under the **MIT License** - see the LICENSE file for details.
