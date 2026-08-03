# Mess Management System (Mess-Mgt)

A comprehensive, role-based application for managing mess/bachelor housing meals, expenses, and deposits. Built with Next.js 15, Prisma, and Tailwind CSS.

## Features
- **Role-based Access**: Admin, Manager, and Member roles with different permissions.
- **Meal Tracking**: Daily tracking for breakfast, lunch, and dinner.
- **Finance Management**: Record deposits and track grocery/utility expenses.
- **Automated Calculations**: Instantly calculates meal rates, individual costs, and due/advance balances.
- **PDF Reporting**: Generate beautiful monthly PDF reports for printing.
- **Activity Logging**: Full audit trail of all actions performed by users.

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in your database credentials.
4. Run migrations: `npx prisma db push`
5. Seed the database: `npm run db:seed`
6. Start the development server: `npm run dev`

## Default Admin Account (from Seed)
- Username: `admin`
- Password: `password123`
