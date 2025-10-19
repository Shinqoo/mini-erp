"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "./checkout";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface StripeCheckoutModalProps {
  orderId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StripeCheckoutModal({
  orderId,
  onClose,
  onSuccess,
}: StripeCheckoutModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
      <div className="bg-gray-900 p-6 rounded-2xl shadow-xl w-96 border border-gray-800">
        <h2 className="text-xl font-bold mb-4 text-center text-white">Complete Payment</h2>
        <Elements stripe={stripePromise}>
          <CheckoutForm orderId={orderId} onSuccess={onSuccess} />
        </Elements>
        <button
          onClick={onClose}
          className="w-full mt-4 bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
