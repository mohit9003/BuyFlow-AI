const express = require("express");
const cors = require("cors");
require("dotenv").config();

const crypto = require("crypto");

const { GoogleGenAI } = require("@google/genai");
const Razorpay = require("razorpay");

const app = express();

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ==========================================
// PRODUCT CATALOGUE
// ==========================================

const products = [
  {
    id: 1,
    name: "Nike Air Zoom Pegasus",
    category: "Running Shoes",
    price: 1899,
    rating: 4.7,
    delivery: "2 days",
  },
  {
    id: 2,
    name: "Adidas Runfalcon 3.0",
    category: "Running Shoes",
    price: 1599,
    rating: 4.5,
    delivery: "2 days",
  },
  {
    id: 3,
    name: "Puma Softride Enzo",
    category: "Running Shoes",
    price: 1299,
    rating: 4.4,
    delivery: "3 days",
  },
  {
    id: 4,
    name: "Samsung Galaxy M56",
    category: "Smartphones",
    price: 18999,
    rating: 4.6,
    delivery: "2 days",
  },
  {
    id: 5,
    name: "OnePlus Nord CE",
    category: "Smartphones",
    price: 19999,
    rating: 4.5,
    delivery: "2 days",
  },
];

// ==========================================
// SEARCH PRODUCTS
// ==========================================

function searchProducts({ category, maxPrice }) {
  let results = [...products];

  if (category) {
    results = results.filter((product) =>
      product.category.toLowerCase().includes(category.toLowerCase())
    );
  }

  if (maxPrice) {
    results = results.filter(
      (product) => product.price <= Number(maxPrice)
    );
  }

  return results;
}

// ==========================================
// CART
// ==========================================

let cart = [];

// Add product to cart
function addToCart(productId) {
  const product = products.find(
    (product) => product.id === Number(productId)
  );

  if (!product) {
    return {
      success: false,
      message: "Product not found",
    };
  }

  const existingProduct = cart.find(
    (item) => item.id === product.id
  );

  if (existingProduct) {
    existingProduct.quantity += 1;
  } else {
    cart.push({
      ...product,
      quantity: 1,
    });
  }

  return {
    success: true,
    message: `${product.name} added to cart`,
    cart: getCart(),
  };
}

// Get cart
function getCart() {
  return {
    items: cart,
    total: cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    ),
  };
}

// Remove product from cart
function removeFromCart(productId) {
  const productIndex = cart.findIndex(
    (item) => item.id === Number(productId)
  );

  if (productIndex === -1) {
    return {
      success: false,
      message: "Product not found in cart",
    };
  }

  cart.splice(productIndex, 1);

  return {
    success: true,
    message: "Product removed from cart",
    cart: getCart(),
  };
}

// Clear cart
function clearCart() {
  cart = [];

  return {
    success: true,
    message: "Cart cleared",
    cart: getCart(),
  };
}

// ==========================================
// BASIC ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.json({
    message: "BuyFlow AI backend is running 🚀",
  });
});

// ==========================================
// PRODUCT API
// ==========================================

app.get("/api/products", (req, res) => {
  const { category, maxPrice } = req.query;

  const results = searchProducts({
    category,
    maxPrice,
  });

  res.json({
    success: true,
    count: results.length,
    products: results,
  });
});

// ==========================================
// CART APIs
// ==========================================

// Get cart
app.get("/api/cart", (req, res) => {
  res.json({
    success: true,
    cart: getCart(),
  });
});

// Add to cart
app.post("/api/cart/add", (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({
      success: false,
      message: "Product ID is required",
    });
  }

  const result = addToCart(productId);

  if (!result.success) {
    return res.status(404).json(result);
  }

  res.json(result);
});

// Remove from cart
app.delete("/api/cart/remove/:productId", (req, res) => {
  const { productId } = req.params;

  const result = removeFromCart(productId);

  if (!result.success) {
    return res.status(404).json(result);
  }

  res.json(result);
});

// Clear cart
app.delete("/api/cart/clear", (req, res) => {
  res.json(clearCart());
});

app.post("/api/payment/create-order", async (req, res) => {
  try {
    const currentCart = getCart();

    if (!currentCart.items.length) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    const order = await razorpay.orders.create({
      amount: currentCart.total * 100,
      currency: "INR",
      receipt: `buyflow_${Date.now()}`,
    });

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Razorpay order error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create Razorpay order",
    });
  }
});

app.post("/api/payment/verify", (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(
        razorpay_order_id + "|" + razorpay_payment_id
      )
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    res.json({
      success: true,
      message: "Payment verified successfully",
      order: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        status: "PAID",
      },
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
});

// ==========================================
// AI CHAT
// ==========================================

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    const currentCart = getCart();

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",

      contents: `
You are BuyFlow AI, an intelligent agentic commerce assistant.

Your job is to help users discover products, compare products,
understand their requirements and make better purchase decisions.

AVAILABLE PRODUCTS:
${JSON.stringify(products, null, 2)}

CURRENT CART:
${JSON.stringify(currentCart, null, 2)}

USER REQUEST:
${message}

RULES:

1. Understand the user's shopping intent.
2. Respect the user's budget.
3. Recommend ONLY products available in the catalogue.
4. Never invent products, prices, ratings or delivery times.
5. Compare products when useful.
6. Explain briefly why a product is suitable.
7. If the user asks about the cart, use the current cart information.
8. Keep responses concise, friendly and useful.
9. Mention price, rating and delivery when recommending products.
10. If no product matches the budget, clearly tell the user.
      `,
    });

    res.json({
      success: true,
      reply: response.text,
    });
  } catch (error) {
    console.error("AI Error:", error);

    res.status(500).json({
      success: false,
      error: "AI service failed",
    });
  }
});

// ==========================================
// SERVER
// ==========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`BuyFlow AI server running on port ${PORT} 🚀`);
});