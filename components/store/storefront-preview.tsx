"use client";

import Image from "next/image";
import type { RestaurantData } from "@/lib/demo-data";

export function StorefrontPreview({ data }: { data: RestaurantData }) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,#f8fafc_0%,#e2e8f0_25%,#cbd5e1_50%,#94a3b8_75%,#475569_100%)]gradient-to-b from-gray-200 to-gray-400 text-black border border-gray-300 shadow-md shadow-soft">
      
      {/* HERO */}
      <div className="relative h-56 w-full bg-[linear-gradient(145deg,#f8fafc_0%,#e2e8f0_25%,#cbd5e1_50%,#94a3b8_75%,#475569_100%)]zinc-900">
        {data.hero ? (
          <Image
            src={data.hero}
            alt={data.name}
            fill
            className="object-cover"
          />
        ) : null}
      </div>

      {/* CONTENT */}
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          
          <div className="relative h-12 w-12 rounded-full overflow-hidden bg-[linear-gradient(145deg,#f8fafc_0%,#e2e8f0_25%,#cbd5e1_50%,#94a3b8_75%,#475569_100%)]zinc-800">
            {data.logo ? (
              <Image
                src={data.logo}
                alt={data.name}
                fill
                className="object-cover"
              />
            ) : null}
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">
              {data.name || "Business Name"}
            </h2>

            {data.phone && (
              <p className="text-xs text-white/60">
                {data.phone}
              </p>
            )}
          </div>
        </div>

        {data.description && (
          <p className="text-sm text-white/60">
            {data.description}
          </p>
        )}

        <div className="text-sm text-white/40">
          {data.items.length} item(s)
        </div>
      </div>
    </div>
  );
}
