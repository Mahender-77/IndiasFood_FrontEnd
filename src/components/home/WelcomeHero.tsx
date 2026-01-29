import { Clock, Shield, Truck } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

export const WelcomeHero = () => {
  return (
    <section className="relative pt-4 px-4 sm:py-16 md:py-20 overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Decorative SVG Patterns - Reduced opacity on mobile */}
      <div className="absolute inset-0 opacity-10 sm:opacity-20">
        <svg className="w-full h-full" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="mandala" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(218,165,32,0.15)" strokeWidth="2"/>
              <circle cx="100" cy="100" r="45" fill="none" stroke="rgba(218,165,32,0.15)" strokeWidth="2"/>
              <circle cx="100" cy="100" r="30" fill="none" stroke="rgba(218,165,32,0.15)" strokeWidth="2"/>
              <path d="M100,40 Q110,50 100,60 Q90,50 100,40" fill="rgba(255,140,0,0.1)"/>
              <path d="M100,140 Q110,150 100,160 Q90,150 100,140" fill="rgba(255,140,0,0.1)"/>
              <path d="M40,100 Q50,110 60,100 Q50,90 40,100" fill="rgba(255,140,0,0.1)"/>
              <path d="M140,100 Q150,110 160,100 Q150,90 140,100" fill="rgba(255,140,0,0.1)"/>
              <circle cx="100" cy="100" r="8" fill="rgba(220,20,60,0.2)"/>
            </pattern>
          </defs>
          <rect width="400" height="400" fill="url(#mandala)"/>
        </svg>
      </div>

      {/* Animated Background Gradients - Reduced on mobile for performance */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-gradient-radial from-yellow-200/20 to-transparent rounded-full animate-pulse hidden sm:block"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-gradient-radial from-orange-200/20 to-transparent rounded-full animate-pulse animation-delay-1000 hidden sm:block"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-gradient-radial from-red-200/15 to-transparent rounded-full animate-pulse animation-delay-2000"></div>
      </div>

      {/* Decorative Borders - Hidden on mobile */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-full max-w-6xl h-12 opacity-60 hidden md:block">
        <svg viewBox="0 0 1200 50" className="w-full h-full">
          <path d="M0,25 Q30,10 60,25 T120,25 T180,25 T240,25 T300,25 T360,25 T420,25 T480,25 T540,25 T600,25 T660,25 T720,25 T780,25 T840,25 T900,25 T960,25 T1020,25 T1080,25 T1140,25 T1200,25"
                stroke="rgba(218,165,32,0.4)" strokeWidth="2" fill="none"/>
          <circle cx="60" cy="25" r="4" fill="rgba(220,20,60,0.5)"/>
          <circle cx="180" cy="25" r="4" fill="rgba(255,140,0,0.5)"/>
          <circle cx="300" cy="25" r="4" fill="rgba(218,165,32,0.5)"/>
          <circle cx="420" cy="25" r="4" fill="rgba(220,20,60,0.5)"/>
          <circle cx="540" cy="25" r="4" fill="rgba(255,140,0,0.5)"/>
          <circle cx="660" cy="25" r="4" fill="rgba(218,165,32,0.5)"/>
          <circle cx="780" cy="25" r="4" fill="rgba(220,20,60,0.5)"/>
          <circle cx="900" cy="25" r="4" fill="rgba(255,140,0,0.5)"/>
          <circle cx="1020" cy="25" r="4" fill="rgba(218,165,32,0.5)"/>
          <circle cx="1140" cy="25" r="4" fill="rgba(220,20,60,0.5)"/>
        </svg>
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 rotate-180 w-full max-w-6xl h-12 opacity-60 hidden md:block">
        <svg viewBox="0 0 1200 50" className="w-full h-full">
          <path d="M0,25 Q30,10 60,25 T120,25 T180,25 T240,25 T300,25 T360,25 T420,25 T480,25 T540,25 T600,25 T660,25 T720,25 T780,25 T840,25 T900,25 T960,25 T1020,25 T1080,25 T1140,25 T1200,25"
                stroke="rgba(218,165,32,0.4)" strokeWidth="2" fill="none"/>
          <circle cx="60" cy="25" r="4" fill="rgba(220,20,60,0.5)"/>
          <circle cx="180" cy="25" r="4" fill="rgba(255,140,0,0.5)"/>
          <circle cx="300" cy="25" r="4" fill="rgba(218,165,32,0.5)"/>
          <circle cx="420" cy="25" r="4" fill="rgba(220,20,60,0.5)"/>
          <circle cx="540" cy="25" r="4" fill="rgba(255,140,0,0.5)"/>
          <circle cx="660" cy="25" r="4" fill="rgba(218,165,32,0.5)"/>
          <circle cx="780" cy="25" r="4" fill="rgba(220,20,60,0.5)"/>
          <circle cx="900" cy="25" r="4" fill="rgba(255,140,0,0.5)"/>
          <circle cx="1020" cy="25" r="4" fill="rgba(218,165,32,0.5)"/>
          <circle cx="1140" cy="25" r="4" fill="rgba(220,20,60,0.5)"/>
        </svg>
      </div>

      {/* Diya Decorations
      <div className="absolute inset-0 flex justify-between items-center px-8 pointer-events-none">
        <div className="text-4xl animate-pulse">🪔</div>
        <div className="text-4xl animate-pulse animation-delay-500">🪔</div>
        <div className="text-4xl animate-pulse animation-delay-1000">🪔</div>
        <div className="text-4xl animate-pulse animation-delay-1500">🪔</div>
      </div> */}

      {/* Main Content */}
      <div className="  relative z-10 max-w-4xl mx-auto text-center px-4">
      <h1
  className="
    text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl
    font-bold
    mb-4 sm:mb-6
    pb-2 sm:pb-3   /* 🔑 THIS FIXES CUTTING */
    leading-[1.2]  /* 🔑 CUSTOM LINE HEIGHT */
    overflow-visible
    bg-gradient-to-r from-amber-800 via-yellow-600 to-orange-600
    bg-clip-text text-transparent
    animate-pulse
  "
>
  Taste the Originals — From Original Source to Your Door Step
</h1>

        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-amber-900 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-2">
          Discover India's most authentic regional foods, crafted by the original inventors and traditional makers who've perfected them for generations.
        </p>

        {/* <Link
          to="/products"
          className="inline-block px-8 sm:px-12 py-3 sm:py-4 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white font-semibold text-lg sm:text-xl rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 border-2 border-yellow-400"
        >
          Explore Sweets
        </Link> */}
      </div>
           {/* Trust Badges */}
      {/* <div className="relative z-10 mt-8 sm:mt-12">
        <div className="flex flex-col justify-center items-center gap-4 sm:gap-6 sm:flex-row sm:flex-wrap max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="p-2 sm:p-3 rounded-full bg-saffron-light flex-shrink-0">
              <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <span className="text-center sm:text-left">Same Day Delivery</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="p-2 sm:p-3 rounded-full bg-saffron-light flex-shrink-0">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <span className="text-center sm:text-left">100% Fresh Guarantee</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="p-2 sm:p-3 rounded-full bg-saffron-light flex-shrink-0">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <span className="text-center sm:text-left">Made to Order</span>
          </div>
        </div>
      </div> */}

    </section>
  );
};