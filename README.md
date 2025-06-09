# ✒️ InkWell Backend API 

A robust backend API built with Express.js and MongoDB, powering the InkWell platform for seamless user authentication, content management, and social interactions. 

## 🚀 Getting Started

### Installation

1.  **Clone the Repository**:

    ```bash
    git clone https://github.com/Maxzi3/inkwell-backend.git
    ```
2.  **Navigate to the Project Directory**:

    ```bash
    cd inkwell-backend
    ```
3.  **Install Dependencies**:

    ```bash
    npm install
    ```

### Environment Variables

Create a `.env` file in the root directory and add the following environment variables:

```
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000/api/auth
DATABASE_LOCAL=mongodb://localhost:27017/inkwell
DATABASE_URI=mongodb+srv://<username>:<password>@cluster0.o5naw35.mongodb.net/inkwell?retryWrites=true&w=majority&appName=Cluster0

JWT_ACCESS_SECRET=<your_access_secret>
JWT_REFRESH_SECRET=<your_refresh_secret>

JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=90

EMAIL_USERNAME=<mailtrap_username>
EMAIL_PASSWORD=<mailtrap_password>
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_FROM=obisikemaxwell2@gmail.com

CLOUDINARY_CLOUD_NAME=<cloudinary_cloud_name>
CLOUDINARY_API_KEY=<cloudinary_api_key>
CLOUDINARY_API_SECRET=<cloudinary_api_secret>
```

### Running the Application

```bash
npm start
```

## ✨ Features

-   **Authentication**: Secure user registration, login, and password management.
-   **Posts Management**: Create, read, update, and delete posts with drafts support.
-   **Comments**: Add, edit, and delete comments on posts.
-   **Likes and Bookmarks**: Like and bookmark posts.
-   **Notifications**: Get notified about likes and comments.
-   **User Profiles**: Update profile information and avatar.
-   **Email Verification**: Verify user emails to enhance security.
-    **Refresh Tokens**: Implement refresh tokens for session security

## 🛠️ Technologies Used

| Technology    | Description                                                     |
| :------------ | :-------------------------------------------------------------- |
| Express.js    | Backend framework for building APIs                             |
| MongoDB       | NoSQL database for storing application data                     |
| Mongoose      | MongoDB object modeling tool designed to work in an asynchronous environment.          |
| JWT           | JSON Web Tokens for authentication                              |
| Nodemailer    | Library for sending emails                                      |
| Cloudinary    | Cloud-based image and video management                          |
| Multer        | Middleware for handling `multipart/form-data` for file uploads |
| CORS | Package for providing a middleware that can enable CORS with various options. |
| Cookie-Parser |  Parse Cookie header and populate req.cookies  |

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api
```

### Endpoints

#### POST /api/auth/signup

**Request**:

```json
{
  "username": "johndoe",
  "fullName": "John Doe",
  "email": "john.doe@example.com",
  "password": "securePassword",
  "phoneNumber": "123-456-7890",
  "passwordConfirm": "securePassword"
}
```

**Response**:

```json
{
  "status": "success",
  "message": "User registered. Please verify your email to complete signup."
}
```

**Errors**:

-   400: "All fields are required"
-   400: "Email already in use"
-   400: "Username already taken"

#### POST /api/auth/login

**Request**:

```json
{
  "email": "john.doe@example.com",
  "password": "securePassword"
}
```

**Response**:

```json
{
  "status": "success",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "_id": "65...",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "username": "johndoe",
      "phoneNumber": "123-456-7890",
      "role": "author",
      "avatar": "https://...",
      "bio": "",
      "emailVerified": "verified",
      "createdAt": "2024-...",
      "updatedAt": "2024-..."
    }
  }
}
```

**Errors**:

-   400: "Please provide email and password"
-   401: "Incorrect email or password"
-   401: "Please verify your email before logging in."

#### GET /api/auth/logout

**Response**:

```json
{
  "status": "success"
}
```

#### POST /api/auth/refresh-token

**Response**:

```json
{
  "status": "success",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors**:

-   401: "No refresh token found"
-   403: "Invalid or expired refresh token"

#### POST /api/auth/forgotPassword

**Request**:

```json
{
  "email": "john.doe@example.com"
}
```

**Response**:

```json
{
  "status": "success",
  "message": "Password reset link sent to email"
}
```

**Errors**:

-   404: "No user found with that email"
-   500: "There was an error sending the email. Try again later!"

#### PATCH /api/auth/reset-password/:token

**Request**:

```json
{
  "password": "newSecurePassword",
  "passwordConfirm": "newSecurePassword"
}
```

**Response**:

```json
{
  "status": "success",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "_id": "65...",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "username": "johndoe",
      "phoneNumber": "123-456-7890",
      "role": "author",
      "avatar": "https://...",
      "bio": "",
      "emailVerified": "verified",
      "createdAt": "2024-...",
      "updatedAt": "2024-..."
    }
  }
}
```

**Errors**:

-   404: "Token is Invalid or expired"

#### PATCH /api/auth/updateMyPassword

**Request**:

```json
{
  "passwordCurrent": "securePassword",
  "password": "newSecurePassword",
  "passwordConfirm": "newSecurePassword"
}
```

**Response**:

```json
{
  "status": "success",
  "message": "Password updated successfully"
}
```

**Errors**:

-   401: "Your password is wrong."

#### GET /api/auth/verify-email/:token

**Response**:

```json
{
  "status": "success",
  "verified": true,
  "redirectTo": "http://localhost:5173/login?verified=true"
}
```

**Errors**:

-   400: "Token is invalid or has expired"

#### POST /api/auth/resend-verification

**Request**:

```json
{
  "email": "john.doe@example.com"
}
```

**Response**:

```json
{
  "status": "success",
  "message": "Verification email resent"
}
```

**Errors**:

-   404: "User not found"
-   400: "Email already verified"

#### GET /api/auth/check-auth

**Response**:

```json
{
  "isAuthenticated": true,
  "user": {
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "avatar": "https://..."
  }
}
```

#### GET /api/posts

**Response**:

```json
{
    "status": "success",
    "results": 5,
    "currentPage": 1,
    "totalPages": 1,
    "totalResults": 5,
    "data": [
        {
            "_id": "667147c526219829f3666869",
            "title": "The Art of Code Refactoring",
            "category": "programming",
            "image": "https://res.cloudinary.com/dqmuagiln/image/upload/v1718709189/posts/post-cover-1718709189834-1234_v07q81.jpg",
            "content": "Code refactoring is essential for maintaining clean, efficient, and readable code. It involves restructuring existing computer code—altering its internal structure—without changing its external behavior. Done right, refactoring can reduce technical debt, improve software maintainability, and enhance overall performance.",
            "author": {
                "_id": "666684d66a74d78698443a60",
                "fullName": "John Doe",
                "avatar": "https://res.cloudinary.com/dqmuagiln/image/upload/v1718315093/user-666684d66a74d78698443a60-1718315093725_z7c30p.jpg"
            },
            "isDraft": false,
            "views": 22,
            "likes": [],
            "bookmarks": [],
            "deleted": false,
            "createdAt": "2024-06-17T18:13:09.435Z",
            "updatedAt": "2024-06-18T21:03:33.353Z",
            "__v": 0
        }
    ]
}
```

#### POST /api/posts

**Request**:

```json
{
    "title": "The Art of Code Refactoring",
    "content": "Code refactoring is essential for maintaining clean, efficient, and readable code. It involves restructuring existing computer code—altering its internal structure—without changing its external behavior. Done right, refactoring can reduce technical debt, improve software maintainability, and enhance overall performance.",
    "category": "programming",
    "image": "https://res.cloudinary.com/dqmuagiln/image/upload/v1718709189/posts/post-cover-1718709189834-1234_v07q81.jpg"
}
```

**Response**:

```json
{
    "status": "success",
    "data": {
        "_id": "667147c526219829f3666869",
        "title": "The Art of Code Refactoring",
        "slug": "the-art-of-code-refactoring",
        "category": "programming",
        "image": "https://res.cloudinary.com/dqmuagiln/image/upload/v1718709189/posts/post-cover-1718709189834-1234_v07q81.jpg",
        "content": "Code refactoring is essential for maintaining clean, efficient, and readable code. It involves restructuring existing computer code—altering its internal structure—without changing its external behavior. Done right, refactoring can reduce technical debt, improve software maintainability, and enhance overall performance.",
        "author": "666684d66a74d78698443a60",
        "isDraft": false,
        "views": 0,
        "likes": [],
        "bookmarks": [],
        "deleted": false,
        "createdAt": "2024-06-17T18:13:09.435Z",
        "updatedAt": "2024-06-17T18:13:09.435Z",
        "__v": 0
    }
}
```

#### GET /api/posts/:id

**Response**:

```json
{
    "status": "success",
    "data": {
        "_id": "667147c526219829f3666869",
        "title": "The Art of Code Refactoring",
        "slug": "the-art-of-code-refactoring",
        "category": "programming",
        "image": "https://res.cloudinary.com/dqmuagiln/image/upload/v1718709189/posts/post-cover-1718709189834-1234_v07q81.jpg",
        "content": "Code refactoring is essential for maintaining clean, efficient, and readable code. It involves restructuring existing computer code—altering its internal structure—without changing its external behavior. Done right, refactoring can reduce technical debt, improve software maintainability, and enhance overall performance.",
        "author": {
            "_id": "666684d66a74d78698443a60",
            "fullName": "John Doe",
            "avatar": "https://res.cloudinary.com/dqmuagiln/image/upload/v1718315093/user-666684d66a74d78698443a60-1718315093725_z7c30p.jpg"
        },
        "isDraft": false,
        "views": 24,
        "likes": [],
        "bookmarks": [],
        "deleted": false,
        "createdAt": "2024-06-17T18:13:09.435Z",
        "updatedAt": "2024-06-18T21:03:33.353Z",
        "__v": 0,
        "comments": []
    }
}
```

## 🤝 Contributing

Contributions are always welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/your-feature`).
6.  Open a pull request.

## 📜 License

This project is licensed under the [MIT License](LICENSE).

## 🧑‍💻 Author Info

*   **Obisike Maxwell**
    *   GitHub: [https://github.com/Maxzi3](https://github.com/Maxzi3)
    *   Twitter: [Placeholder Twitter](placeholder)
    *   LinkedIn: [Placeholder Linkedin](placeholder)

[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://www.npmjs.com/package/dokugen)
