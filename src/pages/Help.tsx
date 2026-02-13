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
          answer:
            'Simply browse our products, add your favorites to the cart, and proceed to checkout. It’s quick, secure, and easy!',
        },
        {
          question: 'Can I modify my order after placing it?',
          answer:
            'To ensure fast delivery, our system begins processing orders immediately. Once placed, orders cannot be modified or changed.',
        },
        {
          question: 'Is there a minimum order value?',
          answer:
            'There is no minimum order value. You can order as little or as much as you like.',
        },
      ],
    },
    {
      category: 'Delivery',
      items: [
        {
          question: 'What is the eligibility for free delivery?',
          answer:
            'Free Delivery is available on all orders of ₹800 or more. For orders below ₹800, delivery charges are calculated at checkout based on your distance from our center.',
        },
        {
          question: 'How long will it take for my order to be delivered?',
          answer:
            'Our instant delivery typically takes between 30 minutes and 2 hours. Delivery times may vary slightly depending on courier availability and your location.',
        },
        {
          question: 'Do you deliver in my locality?',
          answer:
            'We are currently serving Bengaluru. We are expanding soon and look forward to delivering to more cities in the future.',
        },
      ],
    },
    {
      category: 'Returns & Refunds',
      items: [
        {
          question: 'What is your return policy?',
          answer:
            'As our products are perishable, we do not accept returns once delivered. However, if your order arrives damaged or incorrect, please share a photo within 24 hours and we will resolve it promptly.',
        },
        {
          question: 'How long will my refund take?',
          answer:
            'Once approved, refunds are processed to your original payment method within 5–7 business days.',
        },
      ],
    },
    {
      category: 'Payment',
      items: [
        {
          question: 'How can I pay for my order?',
          answer:
            'We accept secure online payments via UPI, Credit/Debit Cards, and Net Banking. Cash on Delivery (COD) is not available at this time.',
        },
        {
          question: 'Is it safe to pay online?',
          answer:
            'Yes, 100%. We use industry-standard SSL encryption and partner with trusted Indian payment gateways. Your transaction details are never stored and are protected with bank-level security.',
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

