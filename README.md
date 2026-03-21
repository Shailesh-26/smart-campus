<div align="center">

# 🏫 Smart Campus Room Booking System

A full-stack web application for managing campus room reservations —
built with **React + Vite** on the frontend and **Spring Boot** on the backend.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.0-6DB33F?logo=springboot)
![MySQL](https://img.shields.io/badge/MySQL-9.5-4479A1?logo=mysql)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38BFF8?logo=tailwindcss)

</div>

---

## 📸 Screenshots



---

## ✨ Features

### 🔐 Authentication & Roles
- JWT-based authentication with role-based access control
- Three roles: **ADMIN**, **TEACHER**, **STUDENT**
- Secure token storage, protected routes per role

### 🏫 Room Management
- Full CRUD for campus rooms (Admin)
- Live availability status — Available / Busy / Under Maintenance
- Filter by search, capacity, availability, sort order
- **Admin maintenance mode** — block rooms with one click

### 📅 Booking System
- Single and **recurring bookings** (custom days + end date)
- Approval workflow: `PENDING → APPROVED / REJECTED / CANCELLED`
- Conflict detection — only APPROVED bookings block slots
- Cancel bookings before they start

### 📊 Admin Dashboard
- Analytics with **Recharts** — bar, line, and pie charts
- Booking volume per day (last 7 days)
- Most booked rooms, status distribution
- Paginated all-bookings table with server-side search + sort

### 📆 Booking Calendar
- **react-big-calendar** integration
- Role-aware — admins see all bookings, users see their own
- Click any event for full booking details

### 📧 Email Notifications
- Booking **approved** / **rejected** emails via JavaMailSender
- **Reminder emails** 30 minutes before booking start (`@Scheduled`)
- Professional HTML email templates

### 📤 Export
- Export bookings as **CSV** or **PDF** (jsPDF + jspdf-autotable)

### 👤 Profile Management
- Update display name
- Change password with strength meter and match indicator

### 🌗 Dark Mode
- Full light/dark theme toggle across all pages
- Persisted to `localStorage` via `ThemeContext`

### 📱 Responsive Design
- Mobile-first layout with hamburger sidebar
- Works on all screen sizes

---

## 🗂️ Project Structure
```
smart-campus-room-booking/
├── frontend/                  # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── context/           # AuthContext, ThemeContext, ToastContext
│   │   ├── layouts/           # DashboardLayout
│   │   ├── pages/             # All page components
│   │   └── services/          # API service layer
│   ├── index.html
│   └── vite.config.js
│
└── backend/                   # Spring Boot + Spring Security + JPA
    └── src/main/java/com/example/demo/
        ├── controller/        # REST controllers
        ├── model/             # JPA entities
        ├── repository/        # Spring Data repositories
        ├── security/          # JWT filter, SecurityConfig
        └── service/           # Business logic + Email + Scheduler
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TailwindCSS, React Router |
| UI Components | Recharts, react-big-calendar, jsPDF |
| Backend | Spring Boot 4, Spring Security, Spring Data JPA |
| Auth | JWT (jjwt), BCrypt password encoding |
| Database | MySQL 9.5, Hibernate ORM |
| Email | JavaMailSender (Gmail SMTP) |
| Scheduling | Spring `@Scheduled` |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Java 21+
- MySQL 8+
- Maven 3.9+

---

### 1. Clone the repository
```bash
git clone https://github.com/Shailesh-26/smart-campus.git
cd smart-campus
```

---

### 2. Database setup
```sql
CREATE DATABASE smart_campus_db;
```

---

### 3. Backend setup
```bash
cd backend
```

Create `src/main/resources/application.properties` with your credentials:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/smart_campus_db
spring.datasource.username=YOUR_DB_USERNAME
spring.datasource.password=YOUR_DB_PASSWORD

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect

spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=YOUR_GMAIL_ADDRESS
spring.mail.password=YOUR_GMAIL_APP_PASSWORD
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

> 💡 For Gmail, use an [App Password](https://myaccount.google.com/apppasswords), not your regular password.
```bash
# Run the backend
mvn spring-boot:run
```

Backend starts on `http://localhost:8080`

---

### 4. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

Frontend starts on `http://localhost:5173`

---

## 🔑 Default Roles & Access

| Role | Access |
|---|---|
| **ADMIN** | Full access — manage rooms, users, all bookings, analytics |
| **TEACHER** | Create bookings, view calendar, manage own bookings |
| **STUDENT** | Create bookings, view calendar, manage own bookings |

> To create an ADMIN account: register normally, then update the role directly in the database or via the Users page once logged in as an existing admin.

---

## 📡 API Overview

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login, returns JWT |

### Rooms
| Method | Endpoint | Access |
|---|---|---|
| GET | `/rooms` | All |
| POST | `/rooms` | Admin |
| PUT | `/rooms/{id}` | Admin |
| DELETE | `/rooms/{id}` | Admin |
| PUT | `/rooms/{id}/maintenance?block=true` | Admin |

### Bookings
| Method | Endpoint | Access |
|---|---|---|
| POST | `/bookings/room/{roomId}` | All |
| GET | `/bookings` | Admin |
| GET | `/bookings/paged` | Admin |
| GET | `/bookings/my` | All |
| PUT | `/bookings/{id}/approve` | Admin |
| PUT | `/bookings/{id}/reject` | Admin |
| DELETE | `/bookings/{id}` | Owner / Admin |

### Users
| Method | Endpoint | Access |
|---|---|---|
| GET | `/users` | Admin |
| GET | `/users/me` | All |
| PUT | `/users/me/name` | All |
| PUT | `/users/me/password` | All |
| PUT | `/users/{id}/role` | Admin |

---

## 🌗 Theme

The app supports full light and dark mode toggled via a sun/moon button in the header and on login/signup pages. Theme preference is persisted to `localStorage`.

---

## 📬 Email Notifications

The system sends HTML emails for:
- ✅ Booking approved
- ❌ Booking rejected  
- ⏰ Reminder 30 minutes before booking start

Configure your Gmail App Password in `application.properties` to enable this.

---

## 🗺️ Roadmap

- [ ] Room reviews and star ratings
- [ ] Booking QR code generation
- [ ] Room timetable / schedule view
- [ ] Waitlist system for full rooms
- [ ] Favourite rooms
- [ ] Personal booking stats

---

## 👨‍💻 Author

**Shailesh Sulakay**
- GitHub: [@Shailesh-26](https://github.com/Shailesh-26)

---

## 📄 License

This project is licensed under the MIT License.