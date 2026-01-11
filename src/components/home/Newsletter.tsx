import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast({
        title: 'Subscribed!',
        description: 'Thank you for subscribing to our newsletter.',
      });
      setEmail('');
    }
  };

  return (
    <section className="section-padding bg-primary">
      <div className="container-custom">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Stay Sweet with Us
          </h2>
          <p className="text-primary-foreground/80 mb-8">
            Subscribe to our newsletter for exclusive offers, new arrivals, and festive specials.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60 focus-visible:ring-primary-foreground"
            />
            <Button type="submit" variant="gold" size="lg" className="gap-2">
              <Send className="h-4 w-4" />
              Subscribe
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
