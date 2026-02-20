TaskFlow – Task Management System with RBAC

A full-stack task management system built with proper Role-Based Access Control (RBAC), secure authentication, and Supabase (PostgreSQL) as the database.

This project focuses on backend authorization, structured database design, and production-style architecture — not just basic CRUD.

Live Demo

https://task-management-system-two-ashen.vercel.app

Tech Stack

Frontend: Next.js + Tailwind CSS
Backend: Node.js + Express.js
Database: Supabase (PostgreSQL)
Authentication: JWT-based authentication
Deployment: Vercel

Features

Role-Based Access Control (Admin & User)
Full Task CRUD operations
Admin-only task assignment
Task workflow states:
To-Do
In Progress
Completed
On Hold

Role-based dashboards
Search and filtering
Soft delete protection
Secure backend permission enforcement

Role Permissions
Admin

Create, edit, delete any task
Assign tasks to users
View all tasks
Manage user roles

User

View only assigned tasks
Edit only their own tasks
Update task status
Cannot assign or delete other users’ tasks

All permissions are enforced at backend level.

Security Implementation

JWT validation on every protected route

Backend role verification middleware

Authorization checks before database operations

Input validation and sanitization

Proper relational integrity using Supabase

Database Structure (Supabase – PostgreSQL)

Core tables:

users
tasks
task_categories
task_comments
task_history
task_attachments

Relationships:

User → Task (creator)

User → Task (assignee)

Task → Comments

Task → History

Task → Category

Setup Instructions


Install dependencies

npm install

Create a .env file and add:

SUPABASE_URL=
SUPABASE_ANON_KEY=
JWT_SECRET=
DATABASE_URL=

Run the project

npm run dev


Notes

Email verification is handled by Supabase.
Custom SMTP requires a verified domain.
The project is designed to demonstrate real-world RBAC and backend security architecture.
