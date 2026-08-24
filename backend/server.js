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

function chooseBestProduct(results) {
  if (!results || results.length === 0) {
    return null;
  }

  return [...results].sort((a, b) => {
    if (b.rating !== a.rating) {
      return b.rating - a.rating;
    }

    const aDays = Number.parseInt(a.delivery) || 999;
    const bDays = Number.parseInt(b.delivery) || 999;

    if (aDays !== bDays) {
      return aDays - bDays;
    }

    return a.price - b.price;
  })[0];
}

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
let orders = [];
let responseHistory = [];
let conversationHistory = [];

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

    const currentCart = getCart();

    const order = {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      items: [...currentCart.items],
      total: currentCart.total,
      status: "PAID",
      date: new Date().toISOString(),
    };

    orders.push(order);

    clearCart();

    res.json({
      success: true,
      message: "Payment verified successfully",
      order,
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
});

app.get("/api/orders", (req, res) => {
  res.json({
    success: true,
    orders,
  });
});

// ==========================================
// AI CHAT + FUNCTION CALLING
// ==========================================

const searchProductsTool = {
  name: "search_products",
  description:
    "Search available products using category and maximum price.",
  parameters: {
    type: "OBJECT",
    properties: {
      category: {
        type: "STRING",
        description:
          "Product category such as Running Shoes or Smartphones",
      },
      maxPrice: {
        type: "NUMBER",
        description: "Maximum budget in INR",
      },
    },
  },
};

const addToCartTool = {
  name: "add_to_cart",
  description:
    "Add an available product to the shopping cart using its product ID.",
  parameters: {
    type: "OBJECT",
    properties: {
      productId: {
        type: "NUMBER",
        description: "The ID of the product to add",
      },
    },
    required: ["productId"],
  },
};

const getCartTool = {
  name: "get_cart",
  description:
    "Get the user's current shopping cart and total amount.",
  parameters: {
    type: "OBJECT",
    properties: {},
  },
};

const aiTools = [
  {
    functionDeclarations: [
      searchProductsTool,
      addToCartTool,
      getCartTool,
    ],
  },
];

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    const userMessage = message.trim();

    conversationHistory.push({
      role: "user",
      parts: [{ text: userMessage }],
    });

    if (conversationHistory.length > 12) {
      conversationHistory = conversationHistory.slice(-12);
    }

    const previousConversation = conversationHistory
      .slice(0, -1)
      .map((turn) => {
        const textPart = turn.parts?.find((part) => part.text);

        if (!textPart) return "";

        return `${turn.role === "model" ? "BuyFlow AI" : "User"}: ${textPart.text}`;
      })
      .filter(Boolean)
      .join("\n");

    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `
You are BuyFlow AI, an intelligent agentic commerce assistant.

AVAILABLE PRODUCTS:
${JSON.stringify(products, null, 2)}

CURRENT CART:
${JSON.stringify(getCart(), null, 2)}

PREVIOUS CONVERSATION:
${previousConversation || "No previous conversation."}

CURRENT USER REQUEST:
${userMessage}

RULES:
1. Understand the current request using the previous conversation.
2. Use search_products when the user wants to find products.
3. Respect the user's budget.
4. Recommend ONLY products available in the catalogue.
5. Use add_to_cart when the user explicitly asks to add a product.
6. Use get_cart when the user asks about the cart.
7. Never invent products, prices, ratings or delivery times.
8. When the user asks for the BEST product, search first and compare matching products.
9. Compare rating, price and delivery time.
10. Choose the best VALUE, not automatically the most expensive product.
11. If the user says "add the best one", search products first, choose the best matching product, then add it to cart.
12. If the user says "it", "that one", "the first one", "the cheaper one", or similar, use the previous conversation to understand the reference.
13. After performing an action, clearly tell the user what happened.
14. Always provide a final natural-language answer after tool calls.
15. Keep the final answer concise, friendly and useful.
16. Use short professional lines instead of one long paragraph.
17. Do not use Markdown symbols such as **, ## or ###.
18. For recommendations use:
Best Choice: Product Name
Price: ₹...
Rating: ⭐...
Delivery: ...

Why: one short sentence.

19. If a product was added, also show:
Cart Update: Product Name added to your cart.
Cart Total: ₹...

20. Never claim that a product was added unless the tool result confirms it.
            `,
          },
        ],
      },
    ];

    let response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: {
        tools: aiTools,
      },
    });

    let lastToolUsed = null;

    while (
      response.functionCalls &&
      response.functionCalls.length > 0
    ) {
      const functionResponses = [];

      contents.push(response.candidates[0].content);

      for (const functionCall of response.functionCalls) {
        console.log(
          "AI Tool:",
          functionCall.name,
          functionCall.args
        );

        lastToolUsed = functionCall.name;

        let result;

        if (functionCall.name === "search_products") {
          result = searchProducts({
            category: functionCall.args?.category,
            maxPrice: functionCall.args?.maxPrice,
          });

          const wantsAdd =
            /\b(add|cart|buy|purchase)\b/i.test(userMessage);

          const wantsBest =
            /\b(best|top|recommend)\b/i.test(userMessage);

          if (wantsAdd && wantsBest && result.length > 0) {
            const bestProduct = chooseBestProduct(result);
            const addResult = addToCart(bestProduct.id);

            result = {
              searchResults: result,
              selectedProduct: bestProduct,
              addToCart: addResult,
            };

            lastToolUsed = "add_to_cart";
          }
        } else if (functionCall.name === "add_to_cart") {
          result = addToCart(
            functionCall.args?.productId
          );
        } else if (functionCall.name === "get_cart") {
          result = getCart();
        } else {
          result = {
            success: false,
            message: "Unknown tool",
          };
        }

        functionResponses.push({
          role: "user",
          parts: [
            {
              functionResponse: {
                name: functionCall.name,
                response: {
                  result,
                },
                id: functionCall.id,
              },
            },
          ],
        });
      }

      contents.push(...functionResponses);

      response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents,
        config: {
          tools: aiTools,
        },
      });
    }

    const finalReply = (
      response.text ||
      "I completed the request successfully."
    )
      .replace(/\*\*/g, "")
      .replace(/^#{1,6}\s*/gm, "")
      .trim();

    conversationHistory.push({
      role: "model",
      parts: [{ text: finalReply }],
    });

    if (conversationHistory.length > 12) {
      conversationHistory = conversationHistory.slice(-12);
    }

    res.json({
      success: true,
      reply: finalReply,
      toolUsed: lastToolUsed,
      cart: getCart(),
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