"use client";

import { useRouter } from "next/navigation";

export default function CancelPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[linear-gradient(145deg,#f8fafc_0%,#e2e8f0_25%,#cbd5e1_50%,#94a3b8_75%,#475569_100%)]gradient-to-b from-gray-200 to-gray-400 text-black border border-gray-300 shadow-md text-white px-6">
      
      {/* Title */}
      <h1 className="text-4xl font-bold mb-4">
        ❌ Payment Cancelled
      </h1>

      {/* Message */}
      <p className="text-center text-gray-300 mb-8 max-w-md">
        Your payment was not completed.
        <br />
        You can go back and try again.
      </p>

      {/* Buttons */}
      <div className="flex gap-4">
        
        <button
          onClick={() => router.back()}
          className="bg-[linear-gradient(145deg,#f8fafc_0%,#e2e8f0_25%,#cbd5e1_50%,#94a3b8_75%,#475569_100%)]white text-black px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition"
        >
          Try Again
        </button>

        <button
          onClick={() => router.push("/")}
          className="border border-white px-6 py-3 rounded-xl font-semibold hover:bg-[linear-gradient(145deg,#f8fafc_0%,#e2e8f0_25%,#cbd5e1_50%,#94a3b8_75%,#475569_100%)]white hover:text-black transition"
        >
          Home
        </button>

      </div>

    </main>
  );
}