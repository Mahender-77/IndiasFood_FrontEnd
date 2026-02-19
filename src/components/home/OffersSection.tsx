import { useState } from "react";

// ─── Offer Data ────────────────────────────────────────────────────────────────
// Add or remove offers here. Each offer needs: id, title, subtitle, icon, badge
const OFFERS = [
  {
    id: 1,
    title: "Free Delivery 🚚",
    subtitle: "On all orders above",
    highlight: "₹800",
    icon: "🛵",
    badge: "Limited Time",
    badgeColor: "bg-yellow-300 text-orange-900",
  },
  // ── Add more offers below ──
  // {
  //   id: 2,
  //   title: "Flat ₹200 OFF",
  //   subtitle: "Use code SAVE200",
  //   highlight: null,
  //   icon: "🏷️",
  //   badge: "Today Only",
  //   badgeColor: "bg-orange-400 text-white",
  // },
];

// ─── Brand logos row (add/remove freely) ──────────────────────────────────────
const BRANDS = ["ITC", "SUBWAY", "NIC", "KFC", "McDonald's"];

export default function OffersSection() {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <section className="w-full bg-amber-50 py-6 px-4 md:px-10 font-sans border-t border-amber-100">
      <div className="max-w-6xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-4 flex flex-row items-end justify-between gap-2">
          <div>
            <span className="inline-block bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-wide uppercase">
              🔥 Hot Deals
            </span>
            <h2 className="text-orange-700 text-xl md:text-3xl font-extrabold leading-tight">
              Special Offers
            </h2>
            <p className="text-orange-400 text-xs md:text-sm mt-1">
              Enjoy more savings on every order
            </p>
          </div>

          {/* Dot indicators — only shown when multiple offers */}
          {OFFERS.length > 1 && (
            <div className="flex gap-2 items-center">
              {OFFERS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === activeIdx
                      ? "bg-orange-500 scale-125"
                      : "bg-orange-200 hover:bg-orange-400"
                  }`}
                  aria-label={`Offer ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Mobile: horizontal scroll strip ── */}
        <div
          className="flex sm:hidden gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {OFFERS.map((offer) => (
            <div key={offer.id} className="snap-start shrink-0 w-[170px]">
              <OfferCard offer={offer} mobile />
            </div>
          ))}
        </div>

        {/* ── Desktop: auto grid ── */}
        <div
          className={`hidden sm:grid gap-4 ${
            OFFERS.length === 1
              ? "grid-cols-1"
              : OFFERS.length === 2
              ? "grid-cols-2"
              : OFFERS.length === 3
              ? "grid-cols-2 lg:grid-cols-3"
              : "grid-cols-2 lg:grid-cols-4"
          }`}
        >
          {OFFERS.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>

        {/* ── Powered By ── */}
        {/* {BRANDS.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-orange-400 text-xs font-semibold uppercase tracking-wider">
              Powered by
            </span>
            {BRANDS.map((brand) => (
              <span
                key={brand}
                className="bg-orange-100 text-orange-700 text-xs font-medium px-3 py-1 rounded-full border border-orange-200"
              >
                {brand}
              </span>
            ))}
          </div>
        )} */}
      </div>
    </section>
  );
}

// ─── Single Offer Card ─────────────────────────────────────────────────────────
function OfferCard({ offer, mobile = false }) {
  return (
    <div
      className={`group bg-orange-500 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between relative overflow-hidden cursor-pointer
        ${mobile ? "p-3 min-h-[130px]" : "p-5 min-h-[180px] rounded-2xl"}`}
    >
      {/* Decorative circle */}
      <div className="absolute -bottom-5 -right-5 w-24 h-24 rounded-full bg-orange-600/40 group-hover:scale-150 transition-transform duration-500" />

      {/* Top row: icon + badge */}
      <div className="flex items-start justify-between">
        <span className={`leading-none ${mobile ? "text-2xl" : "text-4xl"}`}>
          {offer.icon}
        </span>
        <span
          className={`font-bold rounded-full shadow ${offer.badgeColor} ${
            mobile ? "text-[10px] px-2 py-0.5" : "text-xs px-3 py-1"
          }`}
        >
          {offer.badge}
        </span>
      </div>

      {/* Bottom row: text */}
      <div className="mt-3 z-10 relative">
        <h3
          className={`text-white font-extrabold leading-tight ${
            mobile ? "text-sm" : "text-lg"
          }`}
        >
          {offer.title}
        </h3>
        <p className={`text-orange-100 mt-0.5 ${mobile ? "text-[11px]" : "text-sm"}`}>
          {offer.subtitle}
          {offer.highlight && (
            <span className="text-yellow-300 font-bold"> {offer.highlight}</span>
          )}
        </p>
      </div>
    </div>
  );
}