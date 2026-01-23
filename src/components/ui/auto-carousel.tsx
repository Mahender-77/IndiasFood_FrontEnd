import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

interface AutoCarouselProps {
  images: string[];
  autoPlayDelay?: number; // in milliseconds, default 3000ms
  className?: string;
  showDots?: boolean;
  showArrows?: boolean;
}

export function AutoCarousel({
  images,
  autoPlayDelay = 3000,
  className,
  showDots = true,
  showArrows = false
}: AutoCarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const plugin = React.useRef(
    Autoplay({ delay: autoPlayDelay, stopOnInteraction: true })
  );

  return (
    <div className={`relative w-full ${className}`}>
      <Carousel
        plugins={[plugin.current]}
        className="w-full"
        setApi={(api) => {
          if (api) {
            api.on("select", () => {
              setCurrentIndex(api.selectedScrollSnap());
            });
          }
        }}
      >
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={index}>
              <div className="relative w-full h-48 sm:h-64 md:h-80 lg:h-96 xl:h-[500px] overflow-hidden bg-gray-100">
                <img
                  src={image}
                  alt={`Slide ${index + 1}`}
                  className="w-full h-full object-contain transition-transform duration-500 hover:scale-105"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation Arrows */}
        {showArrows && images.length > 1 && (
          <>
            <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-gray-800 shadow-lg border-0 h-12 w-12 rounded-full" />
            <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-gray-800 shadow-lg border-0 h-12 w-12 rounded-full" />
          </>
        )}

        {/* Dots Indicator */}
        {showDots && images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-white shadow-lg scale-125"
                    : "bg-white/50 hover:bg-white/75"
                }`}
                onClick={() => {
                  // This would need the carousel API to programmatically navigate
                  // For now, dots are visual indicators only
                }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </Carousel>
    </div>
  );
}