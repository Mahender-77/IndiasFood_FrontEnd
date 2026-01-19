import { Leaf, Award, Truck, HeartHandshake,ChefHat,Landmark  } from 'lucide-react';

const features = [
  {
    icon: ChefHat,
    title: 'Authentic Manufacturer',
    description: 'Traditional artisans and original inventors who\'ve perfected their craft for generations.',
  },
  {
    icon: Landmark,
    title: 'India\'s Food Experience Center',
    description: 'Curating, preserving, and celebrating India\'s authentic regional culinary heritage.',
  },
  {
    icon: Truck,
    title: 'Fresh Delivery',
    description: 'Same-day delivery ensuring your sweets arrive fresh and perfectly packed.',
  },
  {
    icon: HeartHandshake,
    title: 'You-The Customer ',
    description: 'Experience genuine flavors delivered fresh from their original source to your door.',
  },
];

export function WhyChooseUs() {
  return (
    <section className="section-padding bg-foreground text-background">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            The Indiasfood Promise
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-2">
            Why Choose Us
          </h2>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="text-center animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
                <feature.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">
                {feature.title}
              </h3>
              <p className="text-background/70 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
