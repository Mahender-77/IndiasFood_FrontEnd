import { useState } from 'react';
import { Send, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export function Newsletter() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const handleSubscribe = async () => {
    setIsLoading(true);

    try {
      await api.post('/user/newsletter/subscribe');

      setIsSubscribed(true); // 🔥 important

      toast({
        title: 'Subscribed!',
        description: 'You have successfully subscribed to our newsletter.',
      });
    } catch (error: any) {
      toast({
        title: 'Subscription Failed',
        description:
          error.response?.data?.message || 'Something went wrong.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
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
            Subscribe to our newsletter for exclusive offers and festive specials.
          </p>

          {user?.newsletterSubscribed ? (
            <Button
              variant="outline"
              size="lg"
              className="gap-2 bg-green-600 text-white cursor-not-allowed"
              disabled
            >
              <Check className="h-4 w-4" />
              Subscribed
            </Button>
          ) : (
            <Button
              onClick={handleSubscribe}
              variant="gold"
              size="lg"
              className="gap-2"
              disabled={isLoading}
            >
              <Send className="h-4 w-4" />
              {isLoading ? 'Subscribing...' : 'Subscribe Now'}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
