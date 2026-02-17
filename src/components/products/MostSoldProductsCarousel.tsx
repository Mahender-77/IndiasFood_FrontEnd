import React from 'react';
import { Product } from '@/types';
import { ProductCard } from './ProductCard';
import { cn } from '@/lib/utils'; // Assuming cn utility is available

interface MostSoldProductsCarouselProps {
  products: Product[];
  className?: string; // For additional styling flexibility
}

export const MostSoldProductsCarousel: React.FC<MostSoldProductsCarouselProps> = ({ products, className }) => {
  if (!products || products.length === 0) {
    return null; // Or a placeholder if no products
  }

  return (
    <div className={cn(
      "relative py-6 lg:py-10 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg shadow-inner",
      className
    )}>
      <div className="px-4 mb-6 text-center">
        <h2 className="text-3xl font-bold font-display text-orange-800 mb-2 leading-tight">
          🔥 Our Hottest Picks! 🔥
        </h2>
        <p className="text-md text-orange-700 max-w-2xl mx-auto">
          Don't miss out on what everyone else is loving right now!
        </p>
      </div>
      <div className="flex overflow-x-auto gap-3 px-4 pb-4 scrollbar-hide snap-x snap-mandatory">
        {products.map((product) => (
          <div 
            key={product._id} 
            className="flex-none w-[calc(50%-12px)] sm:w-[calc(33.333%-16px)] md:w-[220px] snap-center"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
};
