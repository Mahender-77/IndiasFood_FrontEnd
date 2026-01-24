import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/seo/SEO';
import { MapPin, Clock, Star } from 'lucide-react';

const About = () => {
  return (
    <Layout>
      <SEO
        title="About Us - India's Food | Authentic Indian Sweets"
        description="Learn about India's Food - bringing India's most iconic foods from their true place of origin directly to your plate since 2026."
        keywords="about us, Indian sweets company, authentic sweets, traditional recipes, origin-based sourcing"
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 py-10 md:py-18 overflow-hidden">
        <div className="absolute inset-0 pattern-dots opacity-20"></div>
        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block ">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm font-medium text-orange-600 shadow-sm">
                <Star className="h-4 w-4 fill-orange-600" />
                Since 2026
              </span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              About Us
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Bringing India's most iconic foods from their true place of origin directly to your plate
            </p>
          </div>
        </div>
      </section>

      {/* Main Story Section */}
      <section className="py-10 md:py-14 bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Content */}
            <div className="order-2 lg:order-1 space-y-6">
              <div className="space-y-4">
                <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                  Founded in <span className="font-semibold text-orange-600">2026</span>, our journey began with a simple yet powerful vision — to bring India's most iconic foods from their true place of origin directly to your plate.
                </p>
                <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                  India is a land of rich culinary heritage, where every region tells a story through its flavors. We bring together famous sweets, traditional snacks, pickles, and namkeens from across the country — all under one roof — exactly as they are made in their hometowns.
                </p>
              </div>

              {/* Highlight Box */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 md:p-8 rounded-2xl border border-orange-100">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground mb-2">
                      Origin-Based Sourcing
                    </h3>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                      What makes us unique is our commitment to origin-based sourcing. We are among the first to curate and deliver foods from their actual place of origin, preserving authenticity while making them easily accessible.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground mb-2">
                    Fresh & Fast
                  </h3>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                    With just one click and within a few hours, India's world-famous flavors reach your doorstep — fresh, genuine, and full of tradition.
                  </p>
                </div>
              </div>
            </div>

            {/* Image/Logo */}
            <div className="order-1 lg:order-2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-200 to-amber-200 rounded-3xl transform rotate-3"></div>
                <div className="relative bg-white rounded-3xl p-8 md:p-12 shadow-xl">
                  <img 
                    src="/IndiasFood-.png" 
                    alt="India's Food Logo" 
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-10 md:py-10 bg-gradient-to-br from-gray-50 to-orange-50">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <div className="space-y-3">
              <p className="text-xl md:text-2xl text-gray-600 leading-relaxed">
                Because to us, this isn't just food.
              </p>
              <h2 className="font-display text-3xl md:text-5xl font-bold text-gradient leading-tight">
                This is India's food — shared with the world.
              </h2>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-orange-600 to-amber-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 pattern-dots opacity-10"></div>
        <div className="container-custom text-center relative z-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Have Questions?
          </h2>
          <p className="text-orange-100 text-base md:text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
            We'd love to hear from you. Reach out to us for any queries about our products, bulk orders, or partnerships.
          </p>
          <a 
            href="mailto:contact@indiasfood.com"
            className="inline-block bg-white text-orange-600 px-8 py-4 rounded-xl font-semibold hover:bg-orange-50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-base md:text-lg"
          >
            Contact Us
          </a>
        </div>
      </section>
    </Layout>
  );
};

export default About;