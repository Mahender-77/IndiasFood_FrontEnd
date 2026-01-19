import React from 'react';
import { cn } from '@/lib/utils';

interface InfiniteScrollTextProps {
  texts: string[];
  speed?: number; // in seconds for one complete cycle
  className?: string;
  textClassName?: string;
  separator?: string;
  direction?: 'left' | 'right';
  pauseOnHover?: boolean;
  mobileOptimized?: boolean;
}

export const InfiniteScrollText: React.FC<InfiniteScrollTextProps> = ({
  texts,
  speed = 30,
  className,
  textClassName,
  separator = ' • ',
  direction = 'left',
  pauseOnHover = true,
  mobileOptimized = true
}) => {
  // Duplicate the texts to create seamless infinite scroll
  const duplicatedTexts = [...texts, ...texts];

  const animationClass = direction === 'left'
    ? 'animate-[scroll-left_30s_linear_infinite]'
    : 'animate-[scroll-right_30s_linear_infinite]';

  const pauseClass = pauseOnHover ? 'pause-animation' : '';

  return (
    <>
      <style>
        {`
          @keyframes scroll-left {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }

          @keyframes scroll-right {
            0% {
              transform: translateX(-50%);
            }
            100% {
              transform: translateX(0);
            }
          }

          .pause-animation:hover {
            animation-play-state: paused;
          }

          @media (max-width: 640px) {
            .pause-animation:active {
              animation-play-state: paused;
            }

            /* Reduce animation complexity on mobile for better performance */
            @keyframes scroll-left {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(-50%);
              }
            }

            @keyframes scroll-right {
              0% {
                transform: translateX(-50%);
              }
              100% {
                transform: translateX(0);
              }
            }
          }

          /* Improve performance on low-end devices */
          @media (prefers-reduced-motion: reduce) {
            .animate-[scroll-left_30s_linear_infinite],
            .animate-[scroll-right_30s_linear_infinite] {
              animation: none;
            }
          }
        `}
      </style>

      <div className={cn("relative overflow-hidden bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 py-2 sm:py-3", className)}>
        {/* Gradient overlays for smooth fade effect - responsive width */}
        <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-12 md:w-16 lg:w-20 bg-gradient-to-r from-orange-500 to-transparent z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-12 md:w-16 lg:w-20 bg-gradient-to-l from-pink-500 to-transparent z-10"></div>

        <div className="flex whitespace-nowrap">
          <div
            className={cn("flex items-center", pauseClass, animationClass)}
            style={{
              animationDuration: `${speed}s`,
            }}
          >
            {duplicatedTexts.map((text, index) => (
              <React.Fragment key={index}>
                <span className={cn(
                  "text-white font-medium text-sm sm:text-base md:text-lg mx-2 sm:mx-3 md:mx-4 inline-block",
                  textClassName
                )}>
                  {text}
                </span>
                {index < duplicatedTexts.length - 1 && (
                  <span className="text-white/80 text-sm sm:text-base md:text-lg mx-1 sm:mx-2">
                    {separator}
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
