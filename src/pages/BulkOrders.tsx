import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/seo/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Package, Users, Truck, Calculator, Phone, Mail, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const BulkOrders = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    quantity: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send the form data to your backend
    toast.success('Inquiry Submitted!', {
      description: 'Our team will contact you within 24 hours.',
    });
    setFormData({ name: '', email: '', phone: '', company: '', quantity: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const benefits = [
    { icon: Calculator, title: 'Special Pricing', desc: 'Get exclusive bulk discounts' },
    { icon: Package, title: 'Custom Packaging', desc: 'Branded boxes available' },
    { icon: Truck, title: 'Pan-India Delivery', desc: 'We deliver everywhere' },
    { icon: Users, title: 'Dedicated Support', desc: 'Personal account manager' },
  ];

  const useCases = [
    'Corporate Events & Meetings',
    'Wedding Celebrations',
    'Festival Gifts (Diwali, Holi, Rakhi)',
    'Employee Appreciation',
    'Client Gifting',
    'Religious Ceremonies',
    'Birthday Parties',
    'Anniversary Celebrations',
  ];

  return (
    <Layout>
      <SEO
        title="Bulk Orders - Corporate & Event Sweet Orders | India's Food"
        description="Order sweets in bulk for corporate events, weddings, festivals, and celebrations. Special pricing and custom packaging available."
        keywords="bulk sweet orders, corporate sweets, wedding sweets, event catering, wholesale sweets, bulk Indian sweets"
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 py-12">
        <div className="container-custom text-center">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
            <Package className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">
            Bulk Orders
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Planning a big event? We've got you covered with special bulk pricing, 
            custom packaging, and reliable pan-India delivery.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center p-6 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Form */}
            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <h2 className="font-display text-2xl font-bold mb-6">Request a Quote</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Name *</label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Company</label>
                    <Input
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      placeholder="Company name"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Email *</label>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Phone *</label>
                    <Input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 XXXXX XXXXX"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Estimated Quantity</label>
                  <Input
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="e.g., 500 boxes, 50 kg"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Message *</label>
                  <Textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us about your requirements..."
                    rows={4}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" size="lg">
                  Submit Inquiry
                </Button>
              </form>
            </div>

            {/* Use Cases */}
            <div>
              <h2 className="font-display text-2xl font-bold mb-6">Perfect For</h2>
              <div className="space-y-3">
                {useCases.map((useCase, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{useCase}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-blue-600 text-white rounded-xl">
                <h3 className="font-semibold text-lg mb-4">Need Immediate Assistance?</h3>
                <div className="space-y-3">
                  <a href="tel:+919876543210" className="flex items-center gap-3 hover:text-blue-200">
                    <Phone className="h-5 w-5" />
                    <span>+91 98765 43210</span>
                  </a>
                  <a href="mailto:bulk@indiasfood.com" className="flex items-center gap-3 hover:text-blue-200">
                    <Mail className="h-5 w-5" />
                    <span>bulk@indiasfood.com</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default BulkOrders;

