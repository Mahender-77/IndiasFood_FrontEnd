import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/seo/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import { Package, Users, Truck, Calculator, Phone, Mail, CheckCircle, CalendarDays, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const EVENT_TYPES = [
  { value: '', label: 'Select event type' },
  { value: 'corporate', label: 'Corporate / Office' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'festival', label: 'Festival' },
  { value: 'religious', label: 'Religious ceremony' },
  { value: 'birthday', label: 'Birthday / party' },
  { value: 'gifting', label: 'Client / employee gifting' },
  { value: 'other', label: 'Other' },
] as const;

/** Static showcase — replace with API-driven list when backend is ready */
const POPULAR_BULK_PRODUCTS = [
  { name: 'Assorted Mithai Box', detail: 'Traditional mix, customizable sizes' },
  { name: 'Kaju Katli & Barfi', detail: 'Festive favourites' },
  { name: 'Ladoo & Chikki', detail: 'Bulk packs for distribution' },
  { name: 'Regional Specialties', detail: 'GI-tagged & regional picks' },
];

const initialForm = {
  name: '',
  email: '',
  phone: '',
  company: '',
  eventType: '',
  deliveryDate: '',
  preferredProducts: '',
  quantity: '',
  message: '',
};

const BulkOrders = () => {
  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.post('/bulk-orders', formData);
      toast.success('Your bulk request has been submitted.', {
        description: 'Our team will contact you within 24 hours with a quote.',
      });
      setFormData({ ...initialForm });
    } catch {
      toast.error('Something went wrong. Please try again or email us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
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

      {/* Available for Bulk Orders */}
      <section className="py-12 bg-gray-50 border-y border-border/60">
        <div className="container-custom">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-blue-600" />
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Available for Bulk Orders
            </h2>
          </div>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            All products are freshly prepared for bulk orders. Tell us your preferences in the form
            and we&apos;ll tailor a quote to your event.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {POPULAR_BULK_PRODUCTS.map((item) => (
              <div
                key={item.name}
                className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-blue-200/80 transition-colors"
              >
                <p className="font-semibold text-foreground mb-1">{item.name}</p>
                <p className="text-sm text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Form */}
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
              <h2 className="font-display text-2xl font-bold mb-2">Request a Quote</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Bulk orders require 3–5 days preparation time. We&apos;ll confirm timelines when we
                reach out.
              </p>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-700 border-b border-blue-100 pb-2">
                    Personal info
                  </h3>
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
                </div>

                {/* Order Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-700 border-b border-blue-100 pb-2">
                    Order details
                  </h3>
                  <p className="text-xs text-muted-foreground bg-blue-50/80 border border-blue-100 rounded-lg px-3 py-2">
                    Bulk orders require 3–5 days preparation time after confirmation.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block" htmlFor="eventType">
                        Event type
                      </label>
                      <select
                        id="eventType"
                        name="eventType"
                        value={formData.eventType}
                        onChange={handleChange}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        {EVENT_TYPES.map((opt, i) => (
                          <option key={`${opt.value}-${i}`} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 flex items-center gap-1.5" htmlFor="deliveryDate">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                        Delivery date
                      </label>
                      <Input
                        id="deliveryDate"
                        name="deliveryDate"
                        type="date"
                        value={formData.deliveryDate}
                        onChange={handleChange}
                        min={new Date().toISOString().slice(0, 10)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Preferred products</label>
                    <Input
                      name="preferredProducts"
                      value={formData.preferredProducts}
                      onChange={handleChange}
                      placeholder="e.g. Kaju katli, mixed mithai, regional specials"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Estimated quantity</label>
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
                      placeholder="Tell us about your requirements, delivery location, and any dietary notes..."
                      rows={4}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                  Submit inquiry
                </Button>
              </form>
            </div>

            {/* Use Cases */}
            <div>
              <h2 className="font-display text-2xl font-bold mb-6">Perfect For</h2>
              <div className="space-y-3">
                {useCases.map((useCase, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
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
