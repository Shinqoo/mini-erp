"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Meta {
  total: number;
  page: number;
  lastPage: number;
}

interface Product {
  id: number;
  sku: string;
  name: string;
  price: number;
  stock: number;
  active: boolean;
  createdAt: string;
}

interface ProductResponse {
  data: Product[];
  meta: Meta;
}

export default function useProducts(page: number = 1, limit: number = 10) {
  const [data, setData] = useState<{ items: Product[]; meta: Meta }>({
    items: [],
    meta: { total: 0, page: 1, lastPage: 1 },
  });
  const [loading, setLoading] = useState(true);

  async function fetchProducts(p: number = page) {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await api.get<ProductResponse>(
        `/products?page=${p}&limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setData({
        items: res.data.data,
        meta: res.data.meta,
      });
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts(page);
  }, [page, limit]);

  return {
    data,
    loading,
    refetch: fetchProducts,
  };
}
