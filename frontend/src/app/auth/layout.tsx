// app/auth/layout.tsx
import React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-indigo-600 to-purple-600 items-center justify-center text-white">
        <div className="text-center px-8">
          <h1 className="text-4xl font-bold mb-4">Welcome to Exodia ERP</h1>
          <p className="text-lg opacity-90">
            Manage your business with ease and efficiency.
          </p>
        </div>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
