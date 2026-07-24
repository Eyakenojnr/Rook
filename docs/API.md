<h1 align="center">API Design Specification</h1>
# Authentication Module
## Global Response Standards
- **Success response structure:**
```
{
    "status": "success",
    "data": { ... }  // Placed in a nested "data" wrapper
}
```
- **Error response structure:**
```
{
    "status": "error",
    "message": "A human-readable error message explaining what failed."
}
```
