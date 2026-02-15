import { Clock, Shield, Truck } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

export const WelcomeHero = () => {
  return (
    <section className="relative py-8 sm:py-12 md:py-16 lg:py-20 px-4 overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      
      {/* Decorative SVG Patterns - Optimized for all screens */}
      <div className="absolute inset-0 opacity-[0.08] sm:opacity-10 md:opacity-20">
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

      {/* Animated Background Gradients - Performance optimized */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-gradient-radial from-yellow-200/20 to-transparent rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-gradient-radial from-orange-200/20 to-transparent rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-96 lg:h-96 bg-gradient-radial from-red-200/15 to-transparent rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Decorative Borders - Tablet and up */}
      <div className="absolute top-4 md:top-8 left-1/2 transform -translate-x-1/2 w-full max-w-6xl h-8 md:h-12 opacity-40 md:opacity-60 hidden sm:block">
        <svg viewBox="0 0 1200 50" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <path d="M0,25 Q30,10 60,25 T120,25 T180,25 T240,25 T300,25 T360,25 T420,25 T480,25 T540,25 T600,25 T660,25 T720,25 T780,25 T840,25 T900,25 T960,25 T1020,25 T1080,25 T1140,25 T1200,25"
                stroke="rgba(218,165,32,0.4)" strokeWidth="2" fill="none"/>
          <circle cx="60" cy="25" r="3" fill="rgba(220,20,60,0.5)"/>
          <circle cx="180" cy="25" r="3" fill="rgba(255,140,0,0.5)"/>
          <circle cx="300" cy="25" r="3" fill="rgba(218,165,32,0.5)"/>
          <circle cx="420" cy="25" r="3" fill="rgba(220,20,60,0.5)"/>
          <circle cx="540" cy="25" r="3" fill="rgba(255,140,0,0.5)"/>
          <circle cx="660" cy="25" r="3" fill="rgba(218,165,32,0.5)"/>
          <circle cx="780" cy="25" r="3" fill="rgba(220,20,60,0.5)"/>
          <circle cx="900" cy="25" r="3" fill="rgba(255,140,0,0.5)"/>
          <circle cx="1020" cy="25" r="3" fill="rgba(218,165,32,0.5)"/>
          <circle cx="1140" cy="25" r="3" fill="rgba(220,20,60,0.5)"/>
        </svg>
      </div>

      <div className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 rotate-180 w-full max-w-6xl h-8 md:h-12 opacity-40 md:opacity-60 hidden sm:block">
        <svg viewBox="0 0 1200 50" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <path d="M0,25 Q30,10 60,25 T120,25 T180,25 T240,25 T300,25 T360,25 T420,25 T480,25 T540,25 T600,25 T660,25 T720,25 T780,25 T840,25 T900,25 T960,25 T1020,25 T1080,25 T1140,25 T1200,25"
                stroke="rgba(218,165,32,0.4)" strokeWidth="2" fill="none"/>
          <circle cx="60" cy="25" r="3" fill="rgba(220,20,60,0.5)"/>
          <circle cx="180" cy="25" r="3" fill="rgba(255,140,0,0.5)"/>
          <circle cx="300" cy="25" r="3" fill="rgba(218,165,32,0.5)"/>
          <circle cx="420" cy="25" r="3" fill="rgba(220,20,60,0.5)"/>
          <circle cx="540" cy="25" r="3" fill="rgba(255,140,0,0.5)"/>
          <circle cx="660" cy="25" r="3" fill="rgba(218,165,32,0.5)"/>
          <circle cx="780" cy="25" r="3" fill="rgba(220,20,60,0.5)"/>
          <circle cx="900" cy="25" r="3" fill="rgba(255,140,0,0.5)"/>
          <circle cx="1020" cy="25" r="3" fill="rgba(218,165,32,0.5)"/>
          <circle cx="1140" cy="25" r="3" fill="rgba(220,20,60,0.5)"/>
        </svg>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">

        {/* Premium Badge */}
        <div className="inline-block mb-4 sm:mb-6">
          <div className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-full border-2 border-yellow-500/50 
                          bg-gradient-to-br from-yellow-400/20 to-orange-400/20 
                          backdrop-blur-md shadow-lg shadow-yellow-500/20
                          hover:shadow-yellow-500/30 transition-shadow duration-300">
            <span className="text-xs sm:text-sm font-bold tracking-wider uppercase 
                           bg-gradient-to-r from-amber-800 to-yellow-600 
                           bg-clip-text text-transparent">
              🇮🇳 India's First Platform
            </span>
          </div>
        </div>

        {/* Main Heading - Responsive typography */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-7xl lg:h-16
                       font-bold
                       mb-4 sm:mb-6
                       leading-tight sm:leading-snug md:leading-[1.2]
                       px-2
                       bg-gradient-to-r from-amber-800 via-yellow-600 to-orange-600
                       bg-clip-text text-transparent
                       animate-pulse">
          Delivering Famous Regional Food
        </h1>

        {/* Sub Heading - Responsive sizing */}
        <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 
                      text-amber-900 
                      mb-6 sm:mb-8 
                      max-w-3xl mx-auto 
                      leading-relaxed 
                      px-4 sm:px-2 
                      font-semibold">
          Directly from Renowned Makers to Your Doorstep
        </p>

        {/* Delivery + Location Info - Stack on mobile, row on larger screens */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 mb-6 sm:mb-8 px-4">
          <div className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 
                          rounded-full border border-amber-400 bg-amber-100/40
                          hover:bg-amber-100/60 hover:border-amber-500 
                          transition-all duration-300
                          w-full sm:w-auto max-w-xs sm:max-w-none">
            <span className="text-base sm:text-lg">⚡</span>
            <span className="text-sm sm:text-base font-semibold text-amber-900">
              Instant Delivery
            </span>
          </div>

          <div className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 
                          rounded-full border border-amber-400 bg-amber-100/40
                          hover:bg-amber-100/60 hover:border-amber-500 
                          transition-all duration-300
                          w-full sm:w-auto max-w-xs sm:max-w-none">
            <span className="text-base sm:text-lg">📍</span>
            <span className="text-sm sm:text-base font-semibold text-amber-900">
              Now Serving Bangalore
            </span>
          </div>
        </div>

        {/* CTA Button - Responsive sizing with touch-friendly target */}
        <Link
          to="/products"
          className="inline-block 
                     px-8 sm:px-10 md:px-12 
                     py-3 sm:py-3.5 md:py-4 
                     bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 
                     text-white 
                     font-semibold 
                     text-base sm:text-lg md:text-xl
                     rounded-full 
                     shadow-2xl 
                     hover:shadow-3xl 
                     active:scale-95
                     hover:scale-105 
                     transform 
                     transition-all duration-300 
                     border-2 border-yellow-400
                     focus:outline-none focus:ring-4 focus:ring-yellow-300
                     w-full sm:w-auto max-w-xs sm:max-w-none mx-auto">
          Order Now
        </Link>

      </div>

      {/* Trust Badges - Optional section, uncomment if needed */}
      {/* <div className="relative z-10 mt-10 sm:mt-12 md:mt-16">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 md:gap-8 max-w-4xl mx-auto">
          
          <div className="flex items-center gap-3 w-full sm:w-auto max-w-xs sm:max-w-none
                          px-4 py-3 sm:px-0 sm:py-0
                          rounded-xl sm:rounded-none
                          bg-white/40 sm:bg-transparent
                          backdrop-blur-sm sm:backdrop-blur-none
                          border border-amber-200/50 sm:border-0
                          hover:bg-white/60 sm:hover:bg-transparent
                          transition-all duration-300">
            <div className="p-2.5 sm:p-3 rounded-full bg-amber-100 flex-shrink-0 
                            shadow-md hover:shadow-lg transition-shadow duration-300">
              <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-amber-700" />
            </div>
            <span className="text-sm sm:text-base font-medium text-amber-900">
              Same Day Delivery
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto max-w-xs sm:max-w-none
                          px-4 py-3 sm:px-0 sm:py-0
                          rounded-xl sm:rounded-none
                          bg-white/40 sm:bg-transparent
                          backdrop-blur-sm sm:backdrop-blur-none
                          border border-amber-200/50 sm:border-0
                          hover:bg-white/60 sm:hover:bg-transparent
                          transition-all duration-300">
            <div className="p-2.5 sm:p-3 rounded-full bg-amber-100 flex-shrink-0
                            shadow-md hover:shadow-lg transition-shadow duration-300">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-amber-700" />
            </div>
            <span className="text-sm sm:text-base font-medium text-amber-900">
              100% Fresh Guarantee
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto max-w-xs sm:max-w-none
                          px-4 py-3 sm:px-0 sm:py-0
                          rounded-xl sm:rounded-none
                          bg-white/40 sm:bg-transparent
                          backdrop-blur-sm sm:backdrop-blur-none
                          border border-amber-200/50 sm:border-0
                          hover:bg-white/60 sm:hover:bg-transparent
                          transition-all duration-300">
            <div className="p-2.5 sm:p-3 rounded-full bg-amber-100 flex-shrink-0
                            shadow-md hover:shadow-lg transition-shadow duration-300">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-amber-700" />
            </div>
            <span className="text-sm sm:text-base font-medium text-amber-900">
              Made to Order
            </span>
          </div>

        </div>
      </div> */}

    </section>
  );
};