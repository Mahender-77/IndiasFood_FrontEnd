import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/seo/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle, Phone, Mail, MessageCircle, Clock, Truck, CreditCard, RotateCcw, Search } from 'lucide-react';
import { useState } from 'react';

const Help = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      category: 'Orders',
      items: [
        {
          question: 'How do I place an order?',
          answer: 'Simply browse our products, add items to your cart, and proceed to checkout. You can pay using various payment methods including UPI, cards, and net banking.',
        },
        {
          question: 'Can I modify my order after placing it?',
          answer: 'You can modify your order within 1 hour of placing it. After that, please contact our support team for assistance.',
        },
        {
          question: 'What is the minimum order value?',
          answer: 'There is no minimum order value. However, orders above ₹500 qualify for free delivery.',
        },
      ],
    },
    {
      category: 'Delivery',
      items: [
        {
          question: 'What are the delivery charges?',
          answer: 'Delivery is free for orders above ₹500. For orders below ₹500, a delivery charge of ₹50 applies.',
        },
        {
          question: 'How long does delivery take?',
          answer: 'We typically deliver within 2-4 business days depending on your location. Same-day delivery is available in select cities.',
        },
        {
          question: 'Do you deliver to my area?',
          answer: 'We currently deliver to all major cities across India. Enter your pincode at checkout to check availability.',
        },
      ],
    },
    {
      category: 'Returns & Refunds',
      items: [
        {
          question: 'What is your return policy?',
          answer: 'Due to the perishable nature of our products, we do not accept returns. However, if you receive damaged or incorrect items, please contact us within 24 hours.',
        },
        {
          question: 'How do I get a refund?',
          answer: 'If eligible for a refund, the amount will be credited to your original payment method within 5-7 business days.',
        },
        {
          question: 'What if I receive damaged products?',
          answer: 'Please take photos of the damaged items and contact us immediately. We will arrange for a replacement or refund.',
        },
      ],
    },
    {
      category: 'Payment',
      items: [
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept UPI, debit/credit cards, net banking, and cash on delivery (COD) in select areas.',
        },
        {
          question: 'Is it safe to pay online?',
          answer: 'Yes, all our payments are processed through secure, PCI-DSS compliant payment gateways.',
        },
        {
          question: 'Can I pay on delivery?',
          answer: 'Cash on Delivery (COD) is available for orders up to ₹5000 in select cities.',
        },
      ],
    },
  ];

  const contactOptions = [
    { icon: Phone, title: 'Call Us', value: '+91 98765 43210', href: 'tel:+919876543210' },
    { icon: Mail, title: 'Email', value: 'support@indiasfood.com', href: 'mailto:support@indiasfood.com' },
    { icon: MessageCircle, title: 'WhatsApp', value: '+91 98765 43210', href: 'https://wa.me/919876543210' },
  ];

  const quickLinks = [
    { icon: Truck, title: 'Track Order', desc: 'Check your order status' },
    { icon: CreditCard, title: 'Payment Issues', desc: 'Resolve payment problems' },
    { icon: RotateCcw, title: 'Returns', desc: 'Initiate a return request' },
  ];

  const filteredFaqs = searchQuery
    ? faqs.map(category => ({
        ...category,
        items: category.items.filter(
          item =>
            item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(category => category.items.length > 0)
    : faqs;

  return (
    <Layout>
      <SEO
        title="Help & Support - India's Food"
        description="Get help with your orders, deliveries, payments, and more. Find answers to frequently asked questions or contact our support team."
        keywords="help, support, FAQ, customer service, contact us, order help"
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-50 to-violet-50 py-12">
        <div className="container-custom text-center">
          <div className="inline-flex items-center justify-center p-3 bg-purple-100 rounded-full mb-4">
            <HelpCircle className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">
            How can we help?
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Find answers to your questions or reach out to our support team
          </p>
          
          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="search"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 h-12"
            />
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-8 bg-white border-b">
        <div className="container-custom">
          <div className="grid sm:grid-cols-3 gap-4">
            {quickLinks.map((link, index) => (
              <button
                key={index}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <link.icon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{link.title}</h3>
                  <p className="text-sm text-muted-foreground">{link.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="font-display text-2xl font-bold mb-8 text-center">
            Frequently Asked Questions
          </h2>
          
          {filteredFaqs.length > 0 ? (
            <div className="max-w-3xl mx-auto space-y-8">
              {filteredFaqs.map((category, catIndex) => (
                <div key={catIndex}>
                  <h3 className="font-semibold text-lg text-purple-600 mb-4">
                    {category.category}
                  </h3>
                  <Accordion type="single" collapsible className="space-y-2">
                    {category.items.map((item, itemIndex) => (
                      <AccordionItem
                        key={itemIndex}
                        value={`${catIndex}-${itemIndex}`}
                        className="border rounded-lg px-4"
                      >
                        <AccordionTrigger className="text-left">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="font-display text-2xl font-bold mb-8 text-center">
            Still need help? Contact us
          </h2>
          
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {contactOptions.map((option, index) => (
              <a
                key={index}
                href={option.href}
                className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow text-center"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <option.icon className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-1">{option.title}</h3>
                <p className="text-sm text-muted-foreground">{option.value}</p>
              </a>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 mt-8 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Support available 9 AM - 9 PM, Monday to Saturday</span>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Help;

