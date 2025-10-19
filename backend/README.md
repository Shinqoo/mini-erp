# 🏗️ Mini-ERP Backend (NestJS + Prisma + PostgreSQL)

This is the backend for the **Mini-ERP with Payments** project.  
It provides REST APIs for authentication, product management, orders, and Stripe payments — including webhook handling and real-time updates via Socket.IO.

---

## 🚀 Tech Stack
- **NestJS (Fastify Adapter)**
- **Prisma ORM**
- **PostgreSQL**
- **Stripe Payment Intents**
- **Socket.IO** for realtime order/payment notifications

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the repository
```bash
git clone https://github.com/<your-repo>/mini-erp.git
cd backend

2️⃣ Install dependencies
npm install

3️⃣ Environment variables
Create a .env file in the backend root:

DATABASE_URL="postgresql://user:password@localhost:5432/erpdb?schema=public"
JWT_SECRET="your_jwt_secret"
STRIPE_SECRET_KEY="your_stripe_secret"
STRIPE_WEBHOOK_SECRET="your_webhook_secret"
CLIENT_URL="http://localhost:3001"


4️⃣ Run database migrations
npx prisma migrate dev
To visualize the database:

npx prisma studio

5️⃣ Start the server
npm run start:dev
The backend will run on http://localhost:3000

