"use client";

import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import api from "@/lib/api";
import { toast } from "react-hot-toast";
import { useState } from "react";

export default function CheckoutForm({
  orderId,
  onSuccess,
}: {
  orderId: number;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error("Stripe has not loaded yet. Please wait a moment.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(
        "/payments/create-intent",
        { orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const clientSecret = res.data.clientSecret;
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        toast.error("Card input not ready yet.");
        return;
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (error) {
        toast.error(error.message || "Payment failed");
      } else if (paymentIntent?.status === "succeeded") {
        toast.success("✅ Payment succeeded!");
        onSuccess();
      }
    } catch (err) {
      console.error(err);
      toast.error("Payment failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CardElement
        options={{
          style: {
            base: {
              fontSize: "16px",
              color: "#000",
              "::placeholder": { color: "#a0aec0" },
            },
          },
          hidePostalCode: true,
        }}
        className="p-2 border rounded bg-white text-black"
      />
      <button
        disabled={!stripe || loading}
        type="submit"
        className="w-full bg-blue-600 text-white p-2 rounded-lg font-semibold hover:bg-blue-700"
      >
        {loading ? "Processing..." : "Pay Now"}
      </button>
    </form>
  );

}
