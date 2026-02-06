import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Instagram, Facebook, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Footer() {
  return (
    <footer className="bg-background/95 text-primary">
      <div className="container-custom section-padding px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-12">
          {/* Brand */}
          <div className="space-y-3 sm:space-y-4">
          <Link to="/" className="shrink-0">
          <img src="/IndiasFood-.png" alt="Indiasfood Logo" className="h-20 w-auto" />
            </Link>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">A unit of Maha foods</p>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              Bringing the authentic taste of India to your doorstep. Handcrafted sweets made with love and tradition.
            </p>
            <div className="flex gap-3 sm:gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Links</h3>
            <ul className="space-y-2 sm:space-y-3">
              {['About Us', 'Products', 'Contact', 'FAQ', 'Become Delivery Partner'].map((item) => (
                <li key={item}>
                  <Link
                    to={item === 'Become Delivery Partner' ? '/delivery/register' : `/${item.toLowerCase().replace(' ', '-')}`}
                    className="text-muted-foreground hover:text-primary text-xs sm:text-sm transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-display text-base sm:text-lg font-semibold mb-3 sm:mb-4">Categories</h3>
            <ul className="space-y-2 sm:space-y-3">
              {['Sweets', 'Dry Sweets', 'Ladoo', 'Halwa', 'Gift Boxes'].map((item) => (
                <li key={item}>
                  <Link
                    to="/products"
                    className="text-muted-foreground hover:text-primary text-xs sm:text-sm transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display text-base sm:text-lg font-semibold mb-3 sm:mb-4">Contact Us</h3>
            <ul className="space-y-3 sm:space-y-4">
              <li className="flex items-start gap-2 sm:gap-3">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-muted-foreground text-xs sm:text-sm leading-tight">
                  <div>location name</div>
                  <div>Bangalore, Karnataka XXXX</div>
                </div>
              </li>
              <li className="flex items-center gap-2 sm:gap-3">
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                <a href="tel:+919876543210" className="text-muted-foreground hover:text-primary text-xs sm:text-sm transition-colors">
                  +91 XXXX XXXX XXXX
                </a>
              </li>
              <li className="flex items-center gap-2 sm:gap-3">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                <a href="mailto:hello@indiasfood.com" className="text-muted-foreground hover:text-primary text-xs sm:text-sm transition-colors break-all">
                  XXX@XXXX.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-primary/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2 sm:gap-4">
            <p className="text-primary/50 text-xs sm:text-sm">
              © {new Date().getFullYear()} Indiasfood. All rights reserved by maha foods.
            </p>
            <div className="flex gap-4 sm:gap-6">
              <Link to="/privacy" className="text-primary/50 hover:text-primary/70 text-xs sm:text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-muted-foreground hover:text-primary/70 text-xs sm:text-sm transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
