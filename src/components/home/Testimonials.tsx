import { Star } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Priya Sharma',
    location: 'Bangalore',
    rating: 5,
    text: 'The Kaju Katli was absolutely divine! It reminded me of the sweets my grandmother used to make. Will definitely order again.',
    image: '/placeholder.svg',
  },
  {
    id: 2,
    name: 'Rajesh Kumar',
    location: 'Mumbai',
    rating: 5,
    text: 'Best Mysore Pak I have ever tasted outside of Mysore. Fresh, authentic, and delivered on time. Highly recommended!',
    image: '/placeholder.svg',
  },
  {
    id: 3,
    name: 'Anita Desai',
    location: 'Delhi',
    rating: 5,
    text: 'Ordered a gift box for Diwali and everyone loved it. The packaging was beautiful and the sweets were incredibly fresh.',
    image: '/placeholder.svg',
  },
];

export function Testimonials() {
  return (
    <section className="section-padding bg-cream">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            Customer Love
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2">
            What Our Customers Say
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className="bg-card rounded-2xl p-6 shadow-card animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-accent text-accent" />
                ))}
              </div>

              {/* Text */}
              <p className="text-foreground leading-relaxed mb-6">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
