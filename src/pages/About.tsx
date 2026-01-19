import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/seo/SEO';
import { Award, Heart, Users, Truck, MapPin, Clock } from 'lucide-react';

const About = () => {
  return (
    <Layout>
      <SEO
        title="About Us - India's Food | Authentic Indian Sweets"
        description="Learn about India's Food - your trusted source for authentic Indian sweets. Our story, values, and commitment to quality traditional recipes."
        keywords="about us, Indian sweets company, authentic sweets, traditional recipes, our story"
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-orange-50 to-amber-50 py-16">
        <div className="container-custom text-center">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            About India's Food
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Bringing the authentic taste of India to your doorstep since 2020.
            Every sweet tells a story of tradition, love, and craftsmanship.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-6">
                Our Story
              </h2>
              <p className="text-muted-foreground mb-4">
                India's Food was born from a simple dream - to share the authentic flavors 
                of Indian sweets with sweet lovers everywhere. What started as a small 
                family kitchen has grown into a beloved brand trusted by thousands.
              </p>
              <p className="text-muted-foreground mb-4">
                Our recipes have been passed down through generations, each one carrying 
                the warmth and love of traditional Indian households. We believe that 
                every sweet should be made with the finest ingredients and utmost care.
              </p>
              <p className="text-muted-foreground">
                Today, we continue to honor these traditions while embracing modern 
                standards of quality and hygiene, ensuring that every bite takes you 
                on a journey through India's rich culinary heritage.
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl p-8 aspect-square flex items-center justify-center">
              <img 
                src="/IndiasFood-.png" 
                alt="India's Food Logo" 
                className="w-3/4 h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-center mb-12">
            Our Values
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Heart className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Made with Love</h3>
              <p className="text-muted-foreground text-sm">
                Every sweet is crafted with passion and care, just like homemade.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Premium Quality</h3>
              <p className="text-muted-foreground text-sm">
                Only the finest ingredients go into our products - no compromises.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Customer First</h3>
              <p className="text-muted-foreground text-sm">
                Your satisfaction is our priority. We're here to serve you better.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Fast Delivery</h3>
              <p className="text-muted-foreground text-sm">
                Fresh sweets delivered to your doorstep quickly and safely.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Wide Reach</h3>
              <p className="text-muted-foreground text-sm">
                Serving customers across multiple cities with same dedication.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Fresh Daily</h3>
              <p className="text-muted-foreground text-sm">
                All our sweets are prepared fresh daily for maximum taste.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-orange-600 text-white">
        <div className="container-custom text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
            Have Questions?
          </h2>
          <p className="text-orange-100 mb-6 max-w-xl mx-auto">
            We'd love to hear from you. Reach out to us for any queries about 
            our products, bulk orders, or partnerships.
          </p>
          <a 
            href="mailto:contact@indiasfood.com"
            className="inline-block bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </section>
    </Layout>
  );
};

export default About;

