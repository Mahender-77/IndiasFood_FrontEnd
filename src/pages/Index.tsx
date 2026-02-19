import { Layout } from '@/components/layout/Layout';
import { Hero } from '@/components/home/Hero';
import { Categories } from '@/components/home/Categories';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { WhyChooseUs } from '@/components/home/WhyChooseUs';
import { Testimonials } from '@/components/home/Testimonials';
import { Newsletter } from '@/components/home/Newsletter';
import { SEO } from '@/components/seo/SEO';
import { WelcomeHero } from '@/components/home/WelcomeHero';
import { InfiniteScrollText } from '@/components/ui/infinite-scroll-text';
import { AutoCarousel } from '@/components/ui/auto-carousel';
import { useEffect, useState } from 'react'; // Added useEffect and useState

import api from '@/lib/api'; // Added api import
import { Product } from '@/types'; // Added Product type import

import image1 from '@/assets/indiasFood (2).jpeg';
import image2 from '@/assets/image2.webp';
import image3 from '@/assets/image3.avif';
import { MostSoldProductsCarousel } from '@/components/products/MostSoldProductsCarousel';
import OffersSection from '@/components/home/OffersSection';


// Sample images for the carousel - replace with your actual images
const carouselImages = [
  "/IndiasFood.png",
  image1,
  image2,
  image3,
];

// Sample texts for infinite scroll
const scrollTexts = [
  
  "🏺 Traditional Recipes",
  "🚚 Instant Delivery",
  "⭐ 100% Pure Ingredients",
  "👨‍🍳 Master Craftsmen",
  "🎁 Perfect for Gifting",
  "📞 24/7 Customer Support",
  "💯 Quality Guaranteed"
];

const Index = () => {
  const [mostSoldProducts, setMostSoldProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchMostSoldProducts = async () => {
      try {
        const response = await api.get('/products/most-saled');
        setMostSoldProducts(response.data.products);
      } catch (error) {
        console.error('Error fetching most sold products:', error);
      }
    };

    fetchMostSoldProducts();
  }, []);

  return (
    <Layout>
      <SEO
        title="Authentic Indian Sweets Delivered Fresh"
        description="Order authentic Indian sweets online. Fresh Gulab Jamun, Kaju Katli, Motichoor Ladoo, Mysore Pak & more. Free delivery above ₹500. Premium quality, traditional recipes, same-day delivery."
        keywords="Indian sweets, Gulab Jamun, Kaju Katli, Motichoor Ladoo, Mysore Pak, Indian mithai, online sweets delivery, fresh sweets, traditional sweets, Indian desserts"
      />
      {/* <Hero /> */}
      <section className="w-full">
        <AutoCarousel
          images={carouselImages}
          autoPlayDelay={4000}
          showDots={true}
          showArrows={true}
          className="w-full"
        />
      </section>
      <MostSoldProductsCarousel products={mostSoldProducts} />
      <OffersSection />

      {/* Welcome Hero Section */}
      <WelcomeHero />

      {/* Infinite Scroll Text */}
      <InfiniteScrollText
        texts={scrollTexts}
        speed={25}
        pauseOnHover={true}
        mobileOptimized={true}
        className="border-t border-b border-orange-300"
      />

      <Categories />
      <FeaturedProducts />
      <WhyChooseUs />
      {/* <Testimonials /> */}
      <Newsletter />
    </Layout>
  );
};

export default Index;