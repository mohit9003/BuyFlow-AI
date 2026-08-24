
# 🛒 BuyFlow AI

### Agentic AI-Powered Commerce Assistant

BuyFlow AI is an AI-powered shopping assistant that helps users discover products, compare options, manage their cart, and move towards checkout through natural conversation.

Instead of using traditional filters and menus, users can simply tell BuyFlow AI what they need, and the AI understands their intent, searches the available catalogue, recommends suitable products, and can perform shopping actions such as adding products to the cart.

---

## ✨ Features

### 🤖 AI Shopping Assistant
- Natural-language product search
- Understands user shopping intent
- Budget-aware recommendations
- Conversational follow-up questions
- AI conversation memory
- Product recommendations with price, rating and delivery information

### 🔎 Product Discovery
- Product catalogue
- Category-based search
- Budget filtering
- AI-powered product recommendations

### ⚖️ Product Comparison
- Compare available products
- Price comparison
- Rating comparison
- Delivery comparison
- Best-value recommendation
- Dynamic comparison based on the user's search

### 🛒 Smart Cart
- Add products to cart
- Remove products from cart
- Quantity management
- Automatic cart total calculation
- AI-assisted add-to-cart actions

### 💳 Checkout
- Razorpay test payment integration
- Payment order creation
- Payment signature verification
- Secure checkout flow

### 📦 Order Management
- Order creation after successful payment
- Order ID and Payment ID
- Order status
- Purchased products
- Order total
- Order history

---

## 🧠 How BuyFlow AI Works

```text
User Intent
     ↓
AI Understands Request
     ↓
Product Search
     ↓
Product Filtering
     ↓
AI Recommendation
     ↓
Product Comparison
     ↓
Add to Cart
     ↓
Checkout
     ↓
Payment Verification
     ↓
Order Confirmation
````

---

## 🛠️ Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS
* JavaScript

### Backend

* Node.js
* Express.js
* CORS
* dotenv

### AI

* Google Gemini API
* Google GenAI SDK
* AI function/tool calling
* Conversational memory

### Payment

* Razorpay Test Mode

### Development Tools

* Git
* GitHub
* Nodemon

---

## 📁 Project Structure

BuyFlow-AI/
│
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md


## ⚙️ Installation

### 1. Clone the repository

bash
git clone https://github.com/mohit9003/BuyFlow-AI.git

bash
cd BuyFlow-AI

---
### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

---

### 3. Configure Environment Variables

Create a `.env` file inside the `backend` folder.

```env
GEMINI_API_KEY=your_gemini_api_key

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

PORT=5000

---

### 4. Start Backend

```bash
npm run dev
```

Backend will run on:

```text
http://localhost:5000
```

---

### 5. Install Frontend Dependencies

Open another terminal:

```bash
cd frontend
npm install
```

---

### 6. Start Frontend

```bash
npm run dev
```

Frontend will run on:

```text
http://localhost:5173
```

---

## 💬 Example AI Queries

Users can interact naturally with BuyFlow AI.

```text
Running shoes under ₹2,000
```

```text
Which one is best?
```

```text
Compare these products
```

```text
Add the best option to cart
```

```text
Show me better options
```

```text
Best phone under ₹20,000
```

---

## 🛍️ Example User Journey

```text
"Find running shoes under ₹2,000"
              ↓
AI finds matching products
              ↓
User asks "Which one is best?"
              ↓
AI compares available options
              ↓
User says "Add that one to cart"
              ↓
Product is added to cart
              ↓
User proceeds to checkout
              ↓
Razorpay test payment
              ↓
Payment verification
              ↓
Order confirmation
```

---

## 🔐 Security

Sensitive credentials are stored using environment variables.

The following files are intentionally ignored by Git:

```text
.env
node_modules/
```

API keys and Razorpay secrets should never be committed to the repository.

---

## 🚀 Future Improvements

* MongoDB persistent database
* User authentication
* Personalized recommendations
* Real product APIs
* Product image search
* Voice-based shopping
* Multi-language AI shopping
* Order tracking
* Wishlist
* Inventory management
* Production payment integration
* Cloud deployment

---

## 🎯 Project Goal

The goal of BuyFlow AI is to demonstrate how conversational AI and agentic workflows can simplify the traditional e-commerce experience.

Instead of manually searching, filtering, comparing and adding products, users can communicate their requirements naturally and let the AI assist them throughout the shopping journey.

---

## 👨‍💻 Author

**Mohit Tiwari**

Built as an AI-powered commerce project focused on:

* Artificial Intelligence
* Agentic AI
* Full Stack Development
* E-Commerce Automation
* Conversational Interfaces

---

## ⭐ Support

If you find this project useful, consider giving the repository a ⭐ on GitHub.

---

## 📄 License

This project is created for educational and demonstration purposes.

```

