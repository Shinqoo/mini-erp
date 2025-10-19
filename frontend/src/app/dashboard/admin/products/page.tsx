"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import { Toaster, toast } from "react-hot-toast";
import { FiEdit, FiTrash2, FiPlus } from "react-icons/fi";
import api from "@/lib/api";
import useProducts from "@/hooks/useProducts"; // 👈 import your custom hook

interface Product {
  id: number;
  sku: string;
  name: string;
  price: number;
  stock: number;
  active: boolean;
  createdAt: string;
}

export default function AdminProductsPage() {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ sku: "", name: "", price: "", stock: "" });
  const [editId, setEditId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const router = useRouter();

  const { data, loading, refetch } = useProducts(page, 10);
  const products = data.items || [];
  const meta = data.meta || { total: 0, page: 1, lastPage: 1 };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("token");

    const basePayload = {
      name: form.name.trim(),
      price: parseFloat(form.price),
      stock: parseInt(form.stock),
    };

    const payload = editId
      ? basePayload
      : { ...basePayload, sku: form.sku.trim() };

    setSaving(true);
    try {
      if (editId) {
        await api.patch(`/products/${editId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Product updated successfully");
      } else {
        await api.post("/products", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Product created successfully");
      }
      setForm({ sku: "", name: "", price: "", stock: "" });
      setEditId(null);
      setShowForm(false);
      refetch(page);
    } catch (err) {
      console.error("Failed to save product", err);
      toast.error("Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("🗑️ Are you sure you want to delete this product?")) return;
    const token = localStorage.getItem("token");
    try {
      await api.delete(`/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Product deleted");
      refetch(page);
    } catch (err) {
      console.error("Failed to delete product", err);
      toast.error("Failed to delete product");
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <Toaster position="top-right" />
      <div className="p-8 max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push("/dashboard/admin")}
          className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-lg mb-4 transition"
        >
          ← Back to Dashboard
        </button>

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">🛒 Manage Products</h1>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditId(null);
              setForm({ sku: "", name: "", price: "", stock: "" });
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium"
          >
            <FiPlus /> {showForm ? "Close Form" : "Add Product"}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <form
            onSubmit={handleSave}
            className="bg-gray-900 p-6 rounded-xl mb-6 border border-gray-800 shadow-lg space-y-4"
          >
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="SKU"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                disabled={!!editId}
                className={`bg-gray-800 p-3 rounded border border-gray-700 focus:ring-2 focus:ring-blue-500 ${
                  editId ? "opacity-60 cursor-not-allowed" : ""
                }`}
                required
              />
              <input
                type="text"
                placeholder="Product Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-gray-800 p-3 rounded border border-gray-700 focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="bg-gray-800 p-3 rounded border border-gray-700 focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="number"
                placeholder="Stock"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="bg-gray-800 p-3 rounded border border-gray-700 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className={`px-5 py-2 rounded-lg font-semibold transition ${
                saving
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {saving
                ? "Saving..."
                : editId
                ? "Update Product"
                : "Create Product"}
            </button>
          </form>
        )}

        {/* Table */}
        {loading ? (
          <p className="text-gray-400">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="p-6 text-gray-400 bg-gray-900 border border-gray-800 rounded-xl">
            No products found.
          </p>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-lg">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-800 text-gray-300">
                  <tr>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Stock</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr
                      key={p.id}
                      className="border-t border-gray-800 hover:bg-gray-800/50 transition"
                    >
                      <td className="p-3 font-mono text-sm text-gray-300">
                        {p.sku}
                      </td>
                      <td className="p-3">{p.name}</td>
                      <td className="p-3">${Number(p.price).toFixed(2)}</td>
                      <td className="p-3">{p.stock}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            p.active
                              ? "bg-green-700/30 text-green-400"
                              : "bg-red-700/30 text-red-400"
                          }`}
                        >
                          {p.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-3 text-right flex justify-end gap-3">
                        <button
                          onClick={() => {
                            setEditId(p.id);
                            setForm({
                              sku: p.sku,
                              name: p.name,
                              price: p.price.toString(),
                              stock: p.stock.toString(),
                            });
                            setShowForm(true);
                          }}
                          className="text-yellow-400 hover:text-yellow-500"
                          title="Edit"
                        >
                          <FiEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-red-500 hover:text-red-600"
                          title="Delete"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                ← Previous
              </button>
              <span className="text-gray-400">
                Page {meta.page} of {meta.lastPage}
              </span>
              <button
                disabled={page >= meta.lastPage}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
