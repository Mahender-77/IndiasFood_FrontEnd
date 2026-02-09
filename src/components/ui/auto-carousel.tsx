import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface AutoCarouselProps {
  images: string[];
  autoPlayDelay?: number;
  className?: string;
  showDots?: boolean;
  showArrows?: boolean;
}

export function AutoCarousel({
  images,
  autoPlayDelay = 3000,
  className,
  showDots = true,
  showArrows = false,
}: AutoCarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const carouselApi = React.useRef<any>(null);

  const autoplay = React.useRef(
    Autoplay({
      delay: autoPlayDelay,
      stopOnInteraction: true,
    })
  );

  return (
    <div className={`relative w-full ${className}`}>
      <Carousel
        plugins={[autoplay.current]}
        className="w-full"
        setApi={(api) => {
          if (!api) return;
          carouselApi.current = api;

          setCurrentIndex(api.selectedScrollSnap());

          api.on("select", () => {
            setCurrentIndex(api.selectedScrollSnap());
          });
        }}
      >
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={index}>
              {/* Responsive Banner Wrapper */}
              <div className="relative w-full h-[28vh] sm:h-[35vh] md:h-[60vh] overflow-hidden bg-gray-100">
                <img
                  src={image}
                  alt={`Slide ${index + 1}`}
                  className="
                    w-full h-full
                    object-cover
                    object-top
                    object-fill
                    sm:object-center
                    transition-transform
                    duration-500
                  "
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Arrows */}
        {showArrows && images.length > 1 && (
          <>
            <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-gray-800 shadow-lg border-0 h-11 w-11 rounded-full" />
            <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-gray-800 shadow-lg border-0 h-11 w-11 rounded-full" />
          </>
        )}

        {/* Dots */}
        {showDots && images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => carouselApi.current?.scrollTo(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-white scale-125 shadow-md"
                    : "bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </Carousel>
    </div>
  );
}
