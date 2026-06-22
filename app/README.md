# 📋 Team Standup Tracker

A modern, fast, and beautifully designed web application for engineering teams to log, track, and analyze their daily standup reports. Designed with a premium "Midnight Aurora" glassmorphism theme, this tool replaces messy spreadsheets and notepad files with a structured, intelligent dashboard.

## ✨ Features

- **📝 Daily Reports**: Log yesterday's work, blockers/issues, solutions, and today's goals.
- **🏷️ Inline @Mentions**: Type `@` anywhere in the text editor to seamlessly tag team projects.
- **📸 Image Attachments**: Simply paste (`Ctrl+V`) screenshots directly into reports; they are automatically processed and saved.
- **📊 Advanced Analytics**: Built-in `Recharts` dashboards to visualize project velocity (Pie charts) and 14-day activity timelines (Bar charts).
- **⚠️ Recurring Issue Detection**: Automatically flags phrases and blockers that repeatedly appear across multiple team members' reports over time.
- **🔐 Role-Based Authentication**: Secure login system. Normal members can only write and edit their own reports. Admins can manage projects, members, and export data.
- **📅 Calendar & History**: Browse past entries with ease.
- **📦 Project & Team Management**: Organize work streams by assigning projects to specific teams (e.g., Web, Mobile, Desktop).

---

## 🛠️ Tech Stack Architecture

This project is built as a full-stack monolithic application using the React ecosystem. 

### Frontend (Client)
- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
- **UI Library**: React
- **Data Visualization**: `recharts` for dynamic, responsive SVG charts.
- **Styling**: Vanilla CSS utilizing modern CSS Variables, Flexbox/Grid, and heavy emphasis on Glassmorphism (translucent backgrounds with blur filters) tailored to a custom "Midnight Aurora" theme.

### Backend (Server)
- **Server Framework**: Next.js (Node.js runtime via Server Actions and API Routes)
- **Database**: [SQLite](https://www.sqlite.org/index.html) (A local file-based database located at `prisma/dev.db`, easily swappable to PostgreSQL for production).
- **ORM**: [Prisma](https://www.prisma.io/) (`@prisma/client`) for secure, type-safe database queries.
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) (Auth.js) using the Credentials provider and `bcryptjs` for secure password hashing.

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### 1. Install Dependencies
Navigate to the project folder and install the required npm packages:
```bash
npm install
```

### 2. Initialize the Database
The project uses Prisma. To generate the client and create your local SQLite database file, run:
```bash
npx prisma generate
npx prisma db push
```

### 3. Seed Initial Data (Optional)
To automatically create the default projects, teams, and an Admin account, run the seed script:
```bash
node src/lib/seed.js
```

### 4. Start the Development Server
Launch the application locally:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Default Credentials

If you ran the seed script, you can log into the application using the default Administrator account:

- **Email**: `admin@example.com`
- **Password**: `password123`

---

## 📁 Project Structure

- `src/app/` - Next.js App Router pages (`/login`, `/daily`, `/entry`, etc.)
- `src/app/api/auth/` - NextAuth backend configuration.
- `src/components/` - Reusable UI components (Sidebar, MentionTextarea, Charts).
- `src/lib/` - Backend logic, utilities, and the Prisma Server Actions interface (`db.js`).
- `prisma/` - Database schema (`schema.prisma`) and the SQLite `.db` file.
- `public/` - Static assets.
