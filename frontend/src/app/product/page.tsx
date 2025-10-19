'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get('/products').then(res => setProducts(res.data.data));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Products</h1>
      <div className="grid grid-cols-3 gap-4">
        {products.map((p: any) => (
          <div key={p.id} className="border rounded p-4 shadow hover:shadow-lg transition">
            <h2 className="font-semibold">{p.name}</h2>
            <p>{p.description}</p>
            <p className="text-blue-600 font-bold">${p.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
