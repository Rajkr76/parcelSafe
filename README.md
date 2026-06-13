# 📦 ParcelSafe

<div align="center">

### Campus Parcel Pickup & Delivery Platform

A production-ready full-stack platform that enables students to request verified campus delivery agents to collect prepaid parcels from the college parcel collection center and safely deliver them to hostels.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E?logo=supabase)](https://supabase.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](#)

---

### 🚀 Built For Modern Campus Logistics

Secure parcel pickup • OTP verification • Real-time tracking • Push notifications • Verified student agents

</div>

---

## ✨ Key Features

### 👨‍🎓 Student Features

* 🔐 Google OAuth Authentication
* 📦 Create parcel pickup requests
* 📸 Verify parcel image before delivery
* 🔢 OTP-based delivery confirmation
* 🔔 Real-time status updates
* ⭐ Rate delivery agents
* 📜 Request history dashboard

### 🚴 Delivery Agent Features

* 🪪 Agent registration & verification
* 📋 Browse available delivery requests
* ✅ Accept parcel assignments
* 📸 Upload parcel verification photos
* 🚚 Mark parcels out for delivery
* 🔑 Verify delivery OTP
* 💰 Performance & ratings tracking

### 🛡️ Admin Features

* 👥 User management
* 🚴 Agent approval workflow
* 📊 Analytics dashboard
* 📦 Request monitoring
* 🚫 Suspension controls
* 📝 Audit logging system

---

## 🏗️ System Architecture

```text
┌────────────────────────────────────────────┐
│                Frontend                     │
│         Next.js 15 + Tailwind CSS          │
└────────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────┐
│               API Gateway                   │
│             Express.js Backend              │
└────────────────────────────────────────────┘
                     │
     ┌───────────────┼───────────────┐
     ▼               ▼               ▼
 Socket.IO       PostgreSQL      ImageKit
 Real-Time        Supabase      File Storage

                     │
                     ▼
                Firebase FCM
             Push Notifications
```

---

# 🛠️ Tech Stack

## Frontend

| Technology         | Purpose              |
| ------------------ | -------------------- |
| ⚛️ React 19        | UI Library           |
| ▲ Next.js 15       | Full Stack Framework |
| 🎨 Tailwind CSS v4 | Styling              |
| 🎬 Framer Motion   | Animations           |
| 🔄 TanStack Query  | Server State         |
| 🔐 NextAuth v5     | Authentication       |

## Backend

| Technology    | Purpose          |
| ------------- | ---------------- |
| 🟢 Node.js    | Runtime          |
| 🚂 Express.js | REST API         |
| 🔷 Prisma ORM | Database Layer   |
| 🐘 PostgreSQL | Database         |
| 🔌 Socket.IO  | Real-time Events |
| 🛡️ JWT       | Authorization    |

## Cloud & DevOps

| Technology      | Purpose            |
| --------------- | ------------------ |
| ☁️ Supabase     | Managed PostgreSQL |
| 🖼️ ImageKit    | Image Storage      |
| 🔔 Firebase FCM | Push Notifications |
| 🐳 Docker       | Containerization   |
| 🌐 Nginx        | Reverse Proxy      |

---

# 💻 Tech Icons

<p align="center">

<img src="https://skillicons.dev/icons?i=nextjs,react,nodejs,express,postgres,prisma,firebase,docker,nginx,tailwind,git,github,vscode" />

</p>

---

# 🔄 Parcel Delivery Workflow

```text
Student Creates Request
          │
          ▼
   OTP Generated
          │
          ▼
 Agent Accepts Request
          │
          ▼
 Parcel Pickup & Photo Upload
          │
          ▼
 Student Verifies Parcel
          │
          ▼
  Out For Delivery
          │
          ▼
 OTP Verification
          │
          ▼
 Delivery Completed
          │
          ▼
 Agent Rating Submitted
```

---

## 📸 Screenshots

Add application screenshots here.

```md
![Student Dashboard](./docs/student-dashboard.png)

![Agent Dashboard](./docs/agent-dashboard.png)

![Admin Dashboard](./docs/admin-dashboard.png)
```

---

## 🔐 Security Features

* JWT Authentication
* Google OAuth 2.0
* Role Based Access Control (RBAC)
* OTP Delivery Verification
* Request Validation
* Rate Limiting
* Secure File Uploads
* Audit Logging

---

## 📈 Future Enhancements

* 📍 Live agent location tracking
* 💳 Online payments
* 🤖 AI-based parcel verification
* 📱 Mobile applications
* 🎓 Multi-campus support
* 📊 Advanced analytics

---

<div align="center">

### Built with Next.js, Express.js, PostgreSQL & Firebase

**ParcelSafe — Making Campus Parcel Delivery Simple & Secure**

</div>
