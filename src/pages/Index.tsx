import { Layout } from '@/components/layout/Layout';
import { Hero } from '@/components/home/Hero';
import { Categories } from '@/components/home/Categories';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { WhyChooseUs } from '@/components/home/WhyChooseUs';
import { Testimonials } from '@/components/home/Testimonials';
import { Newsletter } from '@/components/home/Newsletter';

const Index = () => {
  return (
    <Layout>
      <Hero />
      <Categories />
      <FeaturedProducts />
      <WhyChooseUs />
      <Testimonials />
      <Newsletter />
    </Layout>
  );
};

export default Index;
