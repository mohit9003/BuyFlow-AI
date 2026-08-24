import { useState } from "react";
const RAZORPAY_KEY_ID = "rzp_test_TRXSA86nXAufGY";

const products = [
  {
    id: 1,
    name: "Nike Air Zoom Pegasus",
    category: "Running Shoes",
    price: 1899,
    rating: 4.7,
    delivery: "2 days",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "Adidas Runfalcon 3.0",
    category: "Running Shoes",
    price: 1599,
    rating: 4.5,
    delivery: "2 days",
    image:
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop",
  },
  {
    id: 3,
    name: "Puma Softride Enzo",
    category: "Running Shoes",
    price: 1299,
    rating: 4.4,
    delivery: "3 days",
    image:
      "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600&auto=format&fit=crop",
  },
];

function App() {
  const [message, setMessage] = useState("");
  const [cart, setCart] = useState([]);
  const [aiReply, setAiReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  
  const [orders, setOrders] = useState([]);
  const [showOrders, setShowOrders] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonProducts, setComparisonProducts] = useState([]);


  const loadCart = async () => {
  try {
    const response = await fetch(
      "/api/cart"
    );

    const data = await response.json();

    if (data.success) {
      setCart(data.cart.items || []);
    }
  } catch (error) {
    console.error("Load cart error:", error);
  }
};
  const loadOrders = async () => {
    try {
      const response = await fetch(
        "/api/orders"
      );

      const data = await response.json();

      if (data.success) {
        setOrders(data.orders || []);
        setShowOrders(true);
      }
    } catch (error) {
      console.error("Orders error:", error);
      alert("Unable to load orders.");
    }
  };

  const addProductToCart = async (product) => {
    try {
      const response = await fetch(
        "/api/cart/add",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: product.id,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setCart(data.cart.items || []);
      }
    } catch (error) {
      console.error("Cart error:", error);
    }
  };

  const removeProductFromCart = async (productId) => {
    try {
      const response = await fetch(
        `/api/cart/remove/${productId}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (data.success) {
        setCart(data.cart.items || []);
      } else {
        alert(data.message || "Unable to remove product.");
      }
    } catch (error) {
      console.error("Remove cart error:", error);
      alert("Unable to remove product from cart.");
    }
  };

  const checkout = async () => {
  try {
    const response = await fetch(
      "/api/payment/create-order",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!data.success) {
      alert(data.message);
      return;
    }

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: data.order.amount,
      currency: data.order.currency,
      name: "BuyFlow AI",
      description: "AI Powered Shopping",
      order_id: data.order.id,

      handler: async function (paymentResponse) {
  try {
    const verifyResponse = await fetch(
      "/api/payment/verify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature,
        }),
      }
    );

    const verifyData = await verifyResponse.json();

    if (!verifyData.success) {
      alert("Payment verification failed.");
      return;
    }

    setOrderSuccess(verifyData.order);

    setCart([]);
  } catch (error) {
    console.error("Payment verification error:", error);
    alert("Payment verification failed.");
  }
},

      prefill: {
        name: "BuyFlow User",
        email: "user@example.com",
        contact: "9999999999",
      },

      theme: {
        color: "#7c3aed",
      },
    };

    const razorpay = new window.Razorpay(options);

    razorpay.open();
  } catch (error) {
    console.error("Checkout error:", error);
    alert("Unable to start checkout.");
  }
};

  const askAI = async () => {
    if (!message.trim()) return;

    setLoading(true);
    setAiReply("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
        }),
      });

      const data = await response.json();

setAiReply(data.reply);

const replyText = (data.reply || "").toLowerCase();

const matchedProducts = products.filter((product) => {
  const productName = product.name.toLowerCase();
  return replyText.includes(productName);
});

if (matchedProducts.length > 0) {
  setComparisonProducts(matchedProducts);
} else {
  setComparisonProducts([]);
}

if (data.cart) {
  setCart(data.cart.items || []);
} else if (data.toolUsed === "add_to_cart") {
  await loadCart();
}
    } catch (error) {
      setAiReply(
        "I couldn't connect to the BuyFlow AI server. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = (text) => {
    setMessage(text);
    setAiReply("");
    setComparisonProducts([]);
    setShowComparison(false);
  };

  const getComparisonProducts = () => {
    if (comparisonProducts.length > 0) {
      return comparisonProducts;
    }

    const query = `${message} ${aiReply}`.toLowerCase();

    const category =
      query.includes("phone") || query.includes("smartphone")
        ? "Smartphones"
        : "Running Shoes";

    const budgetMatch = query.match(
      /(?:under|below|within|budget(?:\s+of)?)\s*₹?\s*([\d,]+)/i
    );

    const maxPrice = budgetMatch
      ? Number(budgetMatch[1].replace(/,/g, ""))
      : null;

    return products
      .filter((product) => product.category === category)
      .filter((product) => !maxPrice || product.price <= maxPrice)
      .sort((a, b) => b.rating - a.rating || a.price - b.price);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-lg font-bold">
              B
            </div>

            <div>
              <h1 className="text-xl font-bold">BuyFlow AI</h1>
              <p className="text-xs text-slate-400">
                Agentic Commerce Assistant
              </p>
            </div>
          </div>
         <div className="flex items-center gap-3">
<button
            type="button"
            onClick={loadOrders}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
          >
            📦 Orders
          </button>
          <button
  onClick={() => {
    document
      .getElementById("cart-section")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      
  }}
  
  className="relative rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
  
>
  🛒 Cart

  {cart.length > 0 && (
    <span className="ml-2 rounded-full bg-violet-500 px-2 py-0.5 text-xs">
      {cart.length}
    </span>
  )}
</button>
          </div>
        </div>
      </nav>

      {orderSuccess && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
    <div className="w-full max-w-md rounded-3xl border border-green-400/20 bg-slate-950 p-8 text-center shadow-2xl">
      
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 text-5xl">
        ✓
      </div>

      <h2 className="mt-6 text-3xl font-bold">
        Order Placed Successfully! 🎉
      </h2>

      <p className="mt-3 text-slate-400">
        Your payment has been verified successfully.
      </p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-left">
        <div className="flex justify-between">
          <span className="text-slate-500">
            Order ID
          </span>

          <span className="max-w-[200px] truncate font-medium">
            {orderSuccess.orderId}
          </span>
        </div>

        <div className="mt-4 flex justify-between">
          <span className="text-slate-500">
            Payment ID
          </span>

          <span className="max-w-[200px] truncate font-medium">
            {orderSuccess.paymentId}
          </span>
        </div>

        <div className="mt-4 flex justify-between">
          <span className="text-slate-500">
            Status
          </span>

          <span className="font-semibold text-green-400">
            PAID
          </span>
        </div>
      </div>

      <button
        onClick={() => setOrderSuccess(null)}
        className="mt-6 w-full rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 py-3 font-semibold"
      >
        Continue Shopping
      </button>
    </div>
  </div>
)}
{showOrders && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
    <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 p-8 shadow-2xl">

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-violet-400">
            BUYFLOW AI
          </p>

          <h2 className="mt-1 text-3xl font-bold">
            Order History 📦
          </h2>
        </div>

        <button
          onClick={() => setShowOrders(false)}
          className="rounded-xl border border-white/10 px-4 py-2 text-slate-400 hover:bg-white/5 hover:text-white"
        >
          ✕
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <div className="text-5xl">🛍️</div>

          <h3 className="mt-4 text-xl font-semibold">
            No orders yet
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Your completed orders will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders
            .slice()
            .reverse()
            .map((order) => (
              <div
                key={order.orderId}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-500">
                      ORDER ID
                    </p>

                    <p className="mt-1 max-w-[300px] truncate text-sm font-medium">
                      {order.orderId}
                    </p>
                  </div>

                  <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
                    {order.status}
                  </span>
                </div>

                <div className="mt-5 space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-slate-400">
                        {item.name} × {item.quantity}
                      </span>

                      <span>
                        ₹
                        {(
                          item.price * item.quantity
                        ).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex justify-between border-t border-white/10 pt-4">
                  <span className="text-slate-500">
                    Total
                  </span>

                  <span className="text-lg font-bold">
                    ₹{order.total.toLocaleString("en-IN")}
                  </span>
                </div>

                <p className="mt-3 text-xs text-slate-600">
                  Payment ID: {order.paymentId}
                </p>
              </div>
            ))}
        </div>
      )}
    </div>
  </div>
)}

      {/* Main */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* Hero */}
        <section className="mx-auto max-w-4xl text-center">
          <div className="mb-5 inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-sm text-violet-300">
            ✨ AI-powered shopping agent
          </div>

          <h2 className="text-4xl font-bold leading-tight md:text-6xl">
            Tell me what you want.
            <span className="block bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              I'll handle the rest.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-400">
            Discover products, compare options, manage your cart and move
            towards checkout using a simple conversation.
          </p>

          {/* AI Search */}
          <div className="mx-auto mt-8 max-w-3xl">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 shadow-2xl shadow-violet-950/20">
              <span className="pl-3 text-xl">🤖</span>

              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    askAI();
                  }
                }}
                placeholder="Try: Find running shoes under ₹2,000..."
                className="flex-1 bg-transparent px-2 py-3 text-white outline-none placeholder:text-slate-500"
              />

              <button
                onClick={askAI}
                disabled={loading || !message.trim()}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 font-medium transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Thinking..." : "Ask AI"}
              </button>
            </div>

            {/* Suggestions */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {[
                "Running shoes under ₹2,000",
                "Best phone under ₹20,000",
                "Birthday gift under ₹1,500",
              ].map((text) => (
                <button
                  key={text}
                  onClick={() => handleSuggestion(text)}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-400 transition hover:border-violet-400/30 hover:text-white"
                >
                  {text}
                </button>
              ))}
            </div>

            {/* AI Response */}
            {loading && (
              <div className="mt-6 rounded-2xl border border-violet-400/20 bg-violet-500/10 p-5 text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/20">
                    🤖
                  </div>

                  <div>
                    <p className="font-semibold text-violet-300">
                      BuyFlow AI
                    </p>
                    <p className="text-xs text-slate-500">
                      Understanding your request...
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400"></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:150ms]"></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:300ms]"></span>
                </div>
              </div>
            )}

            {aiReply && !loading && (
              <div className="mt-6 rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/10 to-cyan-500/5 p-5 text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400">
                    🤖
                  </div>

                  <div>
                    <p className="font-semibold text-white">BuyFlow AI</p>
                    <p className="text-xs text-cyan-400">
                      AI Shopping Assistant
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-white/5 bg-black/20 p-4">
                 <p className="whitespace-pre-line text-sm leading-7 text-slate-300">
  {aiReply}
</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => setMessage("Show me better options")}
                    className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400 transition hover:bg-white/5 hover:text-white"
                  >
                    🔄 Better options
                  </button>

                  <button
                    onClick={() => setShowComparison(true)}
                    className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400 transition hover:bg-white/5 hover:text-white"
                  >
                    ⚖️ Compare
                  </button>

                  <button
                    onClick={() => setMessage("Add the best option to cart")}
                    className="rounded-lg border border-violet-400/20 bg-violet-500/10 px-3 py-2 text-xs text-violet-300 transition hover:bg-violet-500/20"
                  >
                    🛒 Add best option
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {showComparison && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
            <div className="max-h-[85vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 p-8 shadow-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-violet-400">BUYFLOW AI</p>
                  <h2 className="mt-1 text-3xl font-bold">Product Comparison ⚖️</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Compare available options before making your decision.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowComparison(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-slate-400 hover:bg-white/5 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {getComparisonProducts().map((product, index) => (
                  <div
                    key={product.id}
                    className={`rounded-2xl border p-5 ${
                      index === 0
                        ? "border-violet-400/30 bg-violet-500/10"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    {index === 0 && (
                      <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-300">
                        BEST VALUE
                      </span>
                    )}

                    <img
                      src={product.image}
                      alt={product.name}
                      className="mt-4 h-40 w-full rounded-xl object-cover"
                    />

                    <p className="mt-4 text-xs text-violet-400">{product.category}</p>
                    <h3 className="mt-1 text-lg font-semibold">{product.name}</h3>

                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Price</span>
                        <span className="font-semibold">
                          ₹{product.price.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Rating</span>
                        <span className="text-yellow-400">⭐ {product.rating}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Delivery</span>
                        <span>{product.delivery}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => addProductToCart(product)}
                      className="mt-5 w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-violet-200"
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-cyan-400/10 bg-cyan-500/5 p-5">
                <p className="text-sm font-semibold text-cyan-300">
                  BuyFlow AI Recommendation
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  The highlighted option has the highest rating among the
                  available products. Consider price and delivery time based
                  on your priorities.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        <section className="mt-16">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-sm font-medium text-violet-400">
                AI RECOMMENDATION
              </p>

              <h3 className="mt-1 text-2xl font-bold">
                Best matches for you
              </h3>
            </div>

            <span className="text-sm text-slate-500">
              Based on your preferences
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition duration-300 hover:-translate-y-1 hover:border-violet-400/30"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-56 w-full object-cover"
                />

                <div className="p-5">
                  <p className="text-xs text-violet-400">
                    {product.category}
                  </p>

                  <h4 className="mt-2 text-lg font-semibold">
                    {product.name}
                  </h4>

                  <div className="mt-3 flex items-center gap-3 text-sm">
                    <span className="text-yellow-400">
                      ★ {product.rating}
                    </span>

                    <span className="text-slate-500">
                      • {product.delivery}
                    </span>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-xl font-bold">
                      ₹{product.price.toLocaleString("en-IN")}
                    </span>

                    <button
                      onClick={() => addProductToCart(product)}
                      className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-violet-200"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>


        {/* Cart */}
{cart.length > 0 && (
  <section
  id="cart-section"
  className="mt-16 rounded-3xl border border-white/10 bg-white/5 p-8"
>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-violet-400">
          YOUR CART
        </p>

        <h3 className="mt-1 text-2xl font-bold">
          Ready to checkout?
        </h3>
      </div>

      <span className="rounded-full bg-violet-500/10 px-4 py-2 text-sm text-violet-300">
        {cart.length} item{cart.length !== 1 ? "s" : ""}
      </span>
    </div>

    <div className="mt-6 space-y-3">
      {cart.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/60 p-4"
        >
          <div className="min-w-0">
            <h4 className="font-semibold">{item.name}</h4>

            <p className="mt-1 text-sm text-slate-500">
              {item.category}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Quantity: {item.quantity || 1}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-bold">
              ₹{(
                item.price * (item.quantity || 1)
              ).toLocaleString("en-IN")}
            </span>

            <button
              type="button"
              onClick={() => removeProductFromCart(item.id)}
              className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
            >
              🗑️ Remove
            </button>
          </div>
        </div>
      ))}
    </div>

    <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
      <span className="text-slate-400">Total</span>

      <span className="text-2xl font-bold">
        ₹
        {cart
          .reduce(
            (total, item) =>
              total + item.price * (item.quantity || 1),
            0
          )
          .toLocaleString("en-IN")}
      </span>
    </div>

    <button
      onClick={checkout}
      className="mt-6 w-full rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 py-4 font-semibold transition hover:scale-[1.01]"
    >
      Proceed to Checkout →
    </button>
  </section>
)}

        {/* Agent Flow */}
        <section className="mt-20 rounded-3xl border border-white/10 bg-gradient-to-br from-violet-500/10 to-cyan-500/5 p-8">
          <div className="text-center">
            <p className="text-sm font-medium text-cyan-400">
              HOW BUYFLOW WORKS
            </p>

            <h3 className="mt-2 text-3xl font-bold">
              From intent to checkout
            </h3>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-5">
            {[
              ["01", "Understand", "AI understands your intent"],
              ["02", "Discover", "Find relevant products"],
              ["03", "Recommend", "Compare & personalize"],
              ["04", "Cart", "Manage your shopping cart"],
              ["05", "Pay", "Move to secure checkout"],
            ].map(([number, title, description]) => (
              <div
                key={number}
                className="rounded-2xl border border-white/10 bg-slate-950/50 p-5"
              >
                <span className="text-xs text-violet-400">{number}</span>

                <h4 className="mt-3 font-semibold">{title}</h4>

                <p className="mt-2 text-sm text-slate-500">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-16 border-t border-white/10 py-8 text-center text-sm text-slate-500">
        Built with AI • BuyFlow AI
      </footer>
    </div>
  );
}

export default App;