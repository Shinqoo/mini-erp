# 💻 Mini-ERP Frontend (Next.js + TailwindCSS)

Frontend client for the **Mini-ERP with Payments** app.  
Provides login/signup, product browsing, checkout via Stripe, and an admin dashboard for managing products & orders.

---

## ⚙️ Setup Instructions

### 1️⃣ Move to frontend folder
```bash
cd frontend

npm install

Create a .env.local file:
NEXT_PUBLIC_API_URL=http://localhost:3000
STRIPE_PUBLIC_KEY=pk_test_12345

npm run dev