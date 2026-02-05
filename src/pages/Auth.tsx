import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/seo/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { Eye, EyeOff, Globe, Home, Lock, Mail, MapPin, User } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type ForgotStep = 'login' | 'email' | 'otp' | 'reset';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();

const [forgotStep, setForgotStep] = useState<ForgotStep>('login');
const [otp, setOtp] = useState('');
const [newPassword, setNewPassword] = useState('');
const [confirmNewPassword, setConfirmNewPassword] = useState('');
const [resendLoading, setResendLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    // address: '',
    // city: '',
    // postalCode: '',
    // country: '',
  });

  const mergeGuestCart = async () => {
    const localCart = JSON.parse(localStorage.getItem('cartItems') || '[]');
  
    if (!Array.isArray(localCart) || localCart.length === 0) return;
  
    try {
      await api.post('/user/cart/merge', {
        items: localCart.map((item: any) => ({
          productId: item.product?._id || item.product,
          qty: item.qty,
          selectedVariantIndex: item.selectedVariantIndex ?? 0,
        })),
      });
  
      localStorage.removeItem('cartItems');
    } catch (err) {
      console.error('Cart merge failed:', err);
    }
  };
  


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // POST /api/auth/login
        const res = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password,
        });
        login(res.data.token);
        await mergeGuestCart();
        toast({
          title: 'Welcome back!',
          description: 'You have successfully logged in.',
        });
      } else {
        // Registration
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: 'Error',
            description: 'Passwords do not match.',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }
        // POST /api/auth/register
        const res = await api.post('/auth/register', {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
        });
        
        login(res.data.token);
        await mergeGuestCart();
        toast({
          title: 'Account created!',
          description: 'You have successfully registered and logged in.',
        });
      }
      navigate('/');
    } catch (error: any) {
      let errorMessage = 'Something went wrong.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  // Forgot Password Functions
  const sendOTP = async () => {
    if (!formData.email) {
      toast({
        title: 'Error',
        description: 'Please enter your email address',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: formData.email });
      toast({
        title: 'Success',
        description: 'OTP sent to your email',
      });
      setForgotStep('otp');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send OTP',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp) {
      toast({
        title: 'Error',
        description: 'Please enter the OTP',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/verify-otp', {
        email: formData.email,
        otp,
      });
      toast({
        title: 'Success',
        description: 'OTP verified successfully',
      });
      setForgotStep('reset');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Invalid OTP',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: formData.email,
        otp,
        password: newPassword,
      });

      toast({
        title: 'Success',
        description: 'Password reset successfully. You can now login with your new password.',
      });

      // Reset forgot password state
      setForgotStep('login');
      setOtp('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reset password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resendOTP = async () => {
    setResendLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: formData.email });
      toast({
        title: 'Success',
        description: 'OTP resent to your email',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to resend OTP',
        variant: 'destructive',
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Layout>
      <SEO
        title={isLogin ? "Login - India's Food" : "Sign Up - India's Food"}
        description={isLogin ? "Login to your account to order authentic Indian sweets. Access your orders, wishlist and delivery tracking." : "Create an account to order fresh Indian sweets online. Get access to exclusive deals and fast delivery."}
        keywords="login, sign up, authentication, Indian sweets account, user registration, login India sweets, create account sweets delivery"
      />
      <section className="section-padding bg-cream min-h-[calc(100vh-200px)] flex items-center">
        <div className="container-custom">
          <div className="max-w-md mx-auto">
            <div className="bg-card rounded-2xl shadow-medium p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                  {forgotStep === 'login' 
                    ? (isLogin ? 'Welcome Back' : 'Create Account')
                    : 'Forgot Password'}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {forgotStep === 'login'
                    ? (isLogin
                    ? 'Sign in to continue ordering delicious sweets'
                      : 'Join us for fresh Indian sweets delivered to your door')
                    : 'Reset your password to regain access to your account'}
                </p>
              </div>

              {/* Forgot Password Flow */}
              {forgotStep !== 'login' && (
                <div className="space-y-4">
                  {/* Step 1: Enter Email */}
                  {forgotStep === 'email' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="forgot-email">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="forgot-email"
                            type="email"
                            placeholder="Enter your registered email"
                            className="pl-10"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({ ...formData, email: e.target.value })
                            }
                            required
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="lg"
                        variant="hero"
                        className="w-full"
                        onClick={sendOTP}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Sending...' : 'Send OTP'}
                      </Button>
                    </>
                  )}

                  {/* Step 2: Verify OTP */}
                  {forgotStep === 'otp' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="otp">Enter OTP</Label>
                        <Input
                          id="otp"
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          OTP has been sent to {formData.email}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="lg"
                        variant="hero"
                        className="w-full"
                        onClick={verifyOTP}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Verifying...' : 'Verify OTP'}
                      </Button>
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={resendOTP}
                          disabled={resendLoading}
                          className="text-sm text-primary hover:underline disabled:opacity-50"
                        >
                          {resendLoading ? 'Resending...' : 'Resend OTP'}
                        </button>
                      </div>
                    </>
                  )}

                  {/* Step 3: Reset Password */}
                  {forgotStep === 'reset' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="new-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter new password"
                            className="pl-10 pr-10"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="confirm-new-password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm new password"
                            className="pl-10 pr-10"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="button"
                        size="lg"
                        variant="hero"
                        className="w-full"
                        onClick={resetPassword}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                      </Button>
                    </>
                  )}

                  {/* Back to Login */}
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotStep('login');
                        setOtp('');
                        setNewPassword('');
                        setConfirmNewPassword('');
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                    >
                      ← Back to Login
                    </button>
                  </div>
                </div>
              )}

              {/* Login/Register Form */}
              {forgotStep === 'login' && (
                <>
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="username">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="Enter your name"
                        className="pl-10"
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({ ...formData, username: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {isLogin && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setForgotStep('email')}
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        className="pl-10 pr-10"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({ ...formData, confirmPassword: e.target.value })
                        }
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* {!isLogin && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <div className="relative">
                        <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="address"
                          type="text"
                          placeholder="Enter your address"
                          className="pl-10"
                          value={formData.address}
                          onChange={(e) =>
                            setFormData({ ...formData, address: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="city"
                            type="text"
                            placeholder="Enter your city"
                            className="pl-10"
                            value={formData.city}
                            onChange={(e) =>
                              setFormData({ ...formData, city: e.target.value })
                            }
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="postalCode"
                            type="text"
                            placeholder="Enter your postal code"
                            className="pl-10"
                            value={formData.postalCode}
                            onChange={(e) =>
                              setFormData({ ...formData, postalCode: e.target.value })
                            }
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="country"
                          type="text"
                          placeholder="Enter your country"
                          className="pl-10"
                          value={formData.country}
                          onChange={(e) =>
                            setFormData({ ...formData, country: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>
                )} */}

                <Button
                  type="submit"
                  size="lg"
                  variant="hero"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
                </Button>
              </form>

              {/* Toggle */}
              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}
                </span>
                {' '}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary font-medium hover:underline"
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </div>
              </>
            )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Auth;
