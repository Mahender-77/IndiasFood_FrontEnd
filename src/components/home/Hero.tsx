import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroImage from '@/assets/hero-sweets.jpg';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-cream">
      {/* Decorative Pattern */}
      <div className="absolute inset-0 pattern-dots opacity-50" />
      
      <div className="container-custom relative px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center min-h-[450px] sm:min-h-[500px] lg:min-h-[600px] py-8 sm:py-12 lg:py-0">
          {/* Content */}
          <div className="space-y-6 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-saffron-light rounded-full">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">Free delivery on orders above ₹500</span>
            </div>
            
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground leading-tight">
              Authentic Indian{' '}
              <span className="text-primary">Sweets</span>{' '}
              Delivered Fresh
            </h1>
            
            <p className="text-base md:text-lg text-muted-foreground max-w-lg">
              Experience the rich traditions of Indian mithai, handcrafted with premium ingredients and generations of expertise. From Kaju Katli to Gulab Jamun, every bite tells a story.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link to="/products">
                <Button size="lg" variant="hero" className="gap-2 group">
                  Explore Sweets
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/about">
                <Button size="lg" variant="outline">
                  Our Story
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 lg:gap-6 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="p-2 rounded-full bg-saffron-light flex-shrink-0">
                  <Truck className="h-4 w-4 text-primary" />
                </div>
                <span>Same Day Delivery</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="p-2 rounded-full bg-saffron-light flex-shrink-0">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <span>100% Fresh Guarantee</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="p-2 rounded-full bg-saffron-light flex-shrink-0">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <span>Made to Order</span>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative lg:h-[600px] flex items-center justify-center">
            <div className="relative w-full max-w-sm sm:max-w-md mx-auto">
              {/* Main Image */}
              <div className="relative z-10 rounded-3xl overflow-hidden shadow-strong animate-scale-in">
                <img
                  src={heroImage}
                  alt="Premium Indian Sweets"
                  className="w-full aspect-[4/5] object-cover"
                />
              </div>
              
              {/* Floating Elements */}
              {/* <div className="absolute -top-2 -left-2 sm:-top-4 sm:-left-4 p-3 sm:p-4 bg-card rounded-xl sm:rounded-2xl shadow-medium animate-float z-20">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gold-light flex items-center justify-center">
                    <span className="text-xl sm:text-2xl">🏆</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-xs sm:text-sm">Best Seller</p>
                    <p className="text-xxs sm:text-xs text-muted-foreground">Kaju Katli</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-2 -right-2 sm:-bottom-4 sm:-right-4 p-3 sm:p-4 bg-card rounded-xl sm:rounded-2xl shadow-medium animate-float z-20" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-saffron-light flex items-center justify-center">
                    <span className="text-xl sm:text-2xl">⭐</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-xs sm:text-sm">4.9 Rating</p>
                    <p className="text-xxs sm:text-xs text-muted-foreground">2000+ Reviews</p>
                  </div>
                </div>
              </div> */}

              {/* Background Decoration */}
              <div className="absolute inset-0 -z-10 translate-x-4 translate-y-4 rounded-3xl bg-primary/20" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
