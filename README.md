# Core PHP 8.3 REST API Resource

This is a complete, production-ready RESTful API resource built in **Core PHP 8.3** without using any frameworks or third-party libraries (no Laravel, Symfony, or Firebase JWT).

## Architecture

This project strictly adheres to the **PSR-12** coding standards and implements a clean **MVC + Service Layer + Repository Pattern** architecture.

- **Routing (`Router.php`)**: Regex-based request dispatcher.
- **Controllers**: Handle HTTP requests and responses.
- **Services**: Contain business logic and validation rules.
- **Repositories**: Handle all PDO database interactions and SQL execution.
- **Models**: Standard data objects representing domain entities.
- **Middleware**: Intercepts requests for Authentication, Error Handling, and Rate Limiting.

## Security Features Included
1. **Prepared Statements**: Used in all `PDO` interactions for SQL Injection protection.
2. **JWT Authentication**: Custom implementation for stateless authentication using `HMAC SHA-256`.
3. **Password Hashing**: Uses `password_hash()` with `bcrypt`.
4. **XSS Protection**: Inputs are stripped of tags, and correct headers are sent.
5. **Rate Limiting**: Custom token bucket logic implemented via filesystem cache.
6. **Secure Headers**: Implemented in `SecurityHeaders.php` (CORS, CSP, STS).

---

## Setup Instructions

1. **Clone or copy the directory** to your web server (e.g., Apache, Nginx) or use the built-in PHP server.
2. **Setup Database**:
   Import `database/schema.sql` into your MySQL 8+ instance.
   ```bash
   mysql -u root -p < database/schema.sql
   ```
3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in your Database credentials and a strong `JWT_SECRET`.
   ```bash
   cp .env.example .env
   ```
4. **Serve the Application**:
   If using the PHP built-in server:
   ```bash
   cd public
   php -S localhost:8000
   ```

---

## API Examples (cURL)

### 1. Authentication (Login to get JWT)
*The default database schema creates an admin user: `admin@example.com` / `Admin@123`*

```bash
curl -X POST http://localhost:8000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@example.com", "password": "Admin@123"}'
```
*Save the `token` from the response to use as a Bearer token in the following admin requests.*

### 2. List Products (Public)
Supports Pagination (`page`, `limit`), Sorting (`sort_by`, `sort_order`), and Filtering (`search`, `status`).
```bash
curl -X GET "http://localhost:8000/api/products?page=1&limit=10&sort_by=price&sort_order=desc"
```

### 3. Get Single Product (Public)
```bash
curl -X GET http://localhost:8000/api/products/1
```

### 4. Create Product (Admin Only)
Replace `YOUR_JWT_TOKEN_HERE` with the token received from the login endpoint.
```bash
curl -X POST http://localhost:8000/api/admin/products \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
     -d '{
           "name": "Mechanical Keyboard",
           "description": "RGB mechanical keyboard with red switches",
           "price": 89.99,
           "stock": 50,
           "status": "active"
         }'
```

### 5. Update Product (Admin Only)
```bash
curl -X PUT http://localhost:8000/api/admin/products/1 \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
     -d '{
           "price": 79.99,
           "stock": 45
         }'
```

### 6. Delete Product (Admin Only)
```bash
curl -X DELETE http://localhost:8000/api/admin/products/1 \
     -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

## Testing

Run the included test runner to verify core components:
```bash
php tests/run_tests.php
```

# portfolio-next-api
