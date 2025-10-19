"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import api from "@/lib/api";
import { Toaster, toast } from "react-hot-toast";
import { FiShoppingCart } from "react-icons/fi";

interface Product {
  id: number;
  sku: string;
  name: string;
  price: number;
  stock: number;
  active: boolean;
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{ [key: number]: number }>({});
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const all = res.data.data || res.data;
      setProducts(all.filter((p: Product) => p.active)); // show only active
    } catch (err) {
      console.error("Failed to load products", err);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  function addToCart(productId: number) {
    setCart((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
  }

  function removeFromCart(productId: number) {
    setCart((prev) => {
      const updated = { ...prev };
      if (updated[productId] > 1) updated[productId]--;
      else delete updated[productId];
      return updated;
    });
  }

  async function handleCheckout() {
    if (Object.keys(cart).length === 0) {
      toast.error("Your cart is empty!");
      return;
    }

    const token = localStorage.getItem("token");
    const items = Object.entries(cart).map(([productId, quantity]) => ({
      productId: Number(productId),
      quantity,
    }));

    try {
      const res = await api.post(
        "/orders",
        { items },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Order created successfully!");
      setCart({});
      router.push("/dashboard/customer");
    } catch (err) {
      console.error("Checkout failed", err);
      toast.error("Failed to create order");
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <Toaster position="top-right" />

      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">🛍️ Shop Products</h1>

          <button
            onClick={handleCheckout}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-5 py-2 rounded-lg font-medium"
          >
            <FiShoppingCart /> Checkout
          </button>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="text-gray-400 bg-gray-900 border border-gray-800 p-6 rounded-xl">
            No active products available.
          </p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col justify-between hover:shadow-lg transition"
              >
                <div>
                  <h2 className="text-xl font-semibold mb-2">{p.name}</h2>
                  <p className="text-gray-400 text-sm mb-4">
                    SKU: <span className="font-mono">{p.sku}</span>
                  </p>
                  <p className="text-2xl font-bold mb-4">
                    ${Number(p.price).toFixed(2)}
                  </p>
                  <p
                    className={`text-sm ${
                      p.stock > 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  {cart[p.id] ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeFromCart(p.id)}
                        className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-lg"
                      >
                        -
                      </button>
                      <span>{cart[p.id]}</span>
                      <button
                        onClick={() => addToCart(p.id)}
                        className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-lg"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(p.id)}
                      disabled={p.stock === 0}
                      className={`w-full mt-2 px-4 py-2 rounded-lg font-medium transition ${
                        p.stock === 0
                          ? "bg-gray-700 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cart Summary */}
        {Object.keys(cart).length > 0 && (
          <div className="mt-10 bg-gray-900 p-6 rounded-xl border border-gray-800">
            <h2 className="text-2xl font-semibold mb-4">🧾 Cart Summary</h2>
            <ul className="space-y-2 text-gray-300">
              {Object.entries(cart).map(([id, qty]) => {
                const product = products.find((p) => p.id === Number(id));
                if (!product) return null;
                return (
                  <li
                    key={id}
                    className="flex justify-between border-b border-gray-800 pb-2"
                  >
                    <span>
                      {product.name} × {qty}
                    </span>
                    <span>${(product.price * qty).toFixed(2)}</span>
                  </li>
                );
              })}
            </ul>
            <div className="flex justify-between font-semibold text-lg mt-4">
              <span>Total</span>
              <span>
                $
                {Object.entries(cart)
                  .reduce((sum, [id, qty]) => {
                    const product = products.find(
                      (p) => p.id === Number(id)
                    );
                    return sum + (product ? product.price * qty : 0);
                  }, 0)
                  .toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
