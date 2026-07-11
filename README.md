# 🍳 Cloud Kitchen Admin Panel — Member 1 Modules

A full-stack admin dashboard for managing a Cloud Kitchen platform, built with **React**, **Tailwind CSS**, **Node.js**, **Express**, and **MongoDB**.

## 📋 Modules (Member 1)

| Module | Features |
|--------|----------|
| **Dashboard** | Key stats, revenue trends, order charts, top home cooks, recent orders |
| **Home Cook Management** | View, create, edit, approve/reject, suspend/activate, delete |
| **Customer Management** | View, edit, block/unblock, delete, order history |
| **Delivery Partner Management** | CRUD, document verification, status management, order assignment |

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+
- **MongoDB** (local or Atlas)

### 1. Clone & Setup
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment
Edit `.env` in the project root:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cloud-kitchen
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
```

### 3. Seed Database
```bash
cd server
npm run seed
```
This creates sample data + admin account:
- **Email:** `admin@cloudkitchen.com`
- **Password:** `admin123`

### 4. Run Development Servers
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

Frontend: `http://localhost:5173` | Backend: `http://localhost:5000`

## 🏗️ Architecture

```
CLOUD KITCHEN/
├── client/           # React + Vite + Tailwind CSS v4
│   ├── src/
│   │   ├── api/      # Axios API services (reusable for React Native)
│   │   ├── components/
│   │   │   ├── common/   # StatusBadge, Modal, Pagination, etc.
│   │   │   └── layout/   # Sidebar, Navbar, Layout
│   │   ├── context/      # AuthContext (React Native compatible)
│   │   ├── pages/        # Page components per module
│   │   └── utils/        # Helpers, formatters
│   └── ...
├── server/           # Node.js + Express
│   ├── config/       # DB connection
│   ├── controllers/  # Business logic
│   ├── middleware/    # Auth, error handling
│   ├── models/       # Mongoose schemas
│   ├── routes/       # RESTful endpoints
│   └── seeders/      # Database seeder
└── .env
```

## 📱 React Native Conversion

This project is architected for easy React Native migration:
- **`api/`**, **`context/`**, **`utils/`** → 100% reusable
- Swap `react-router-dom` → React Navigation
- Swap HTML/Tailwind → React Native components + NativeWind
- Swap `localStorage` → AsyncStorage
- Swap `recharts` → react-native-chart-kit

## 🔗 API Endpoints

| Resource | Endpoints |
|----------|-----------|
| Auth | `POST /api/auth/login`, `GET /api/auth/profile` |
| Dashboard | `GET /api/dashboard/stats`, `GET /api/dashboard/charts` |
| Home Cooks | `GET/POST /api/home-cooks`, `GET/PUT/DELETE /api/home-cooks/:id`, `PATCH /api/home-cooks/:id/status` |
| Customers | `GET /api/customers`, `GET/PUT/DELETE /api/customers/:id`, `PATCH /api/customers/:id/status` |
| Delivery Partners | `GET/POST /api/delivery-partners`, `GET/PUT/DELETE /api/delivery-partners/:id`, `PATCH /:id/status`, `PATCH /:id/verify`, `PATCH /:id/assign` |

## 🧩 Integration with Other Members

Other team members can add their modules by:
1. Adding new **models** in `server/models/`
2. Adding new **controllers** in `server/controllers/`
3. Adding new **routes** in `server/routes/` and registering in `server.js`
4. Adding new **pages** in `client/src/pages/`
5. Adding navigation items in `client/src/components/layout/Sidebar.jsx`

No changes to core infrastructure needed!

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS v4 |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Auth | JWT (jsonwebtoken, bcryptjs) |
| Charts | Recharts |
| Icons | React Icons |
| Notifications | React Hot Toast |
