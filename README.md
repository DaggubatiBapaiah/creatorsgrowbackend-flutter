# CreatorsGrow Backend REST API

This is the Node.js + TypeScript + Express backend engine for the CreatorsGrow social growth platform.

## Features Included
* Rest API structured foundation
* Secure JWT Authentication
* PostgreSQL Database Schema and migrations
* Zod Request Body Validation
* Automated Jest integration testing

## Prerequisites
* Node.js (v18+)
* PostgreSQL running locally or on Supabase

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Create a `.env` file from the example:
   ```bash
   copy .env.example .env
   ```
   Set your local `DATABASE_URL` and `JWT_SECRET` in `.env`.

3. **Run Migrations**
   ```bash
   npm run migrate
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   ```

6. **Run Tests**
   ```bash
   npm test
   ```

## Endpoint Listing

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **GET** | `/health` | Server & Database connectivity status | No |
| **POST** | `/api/v1/auth/register` | Register a new creator account | No |
| **POST** | `/api/v1/auth/login` | Login and retrieve session JWT | No |
| **GET** | `/api/v1/auth/me` | Get currently logged in user info | Yes (Bearer) |
| **POST** | `/api/v1/auth/logout` | Terminate session | Yes (Bearer) |
