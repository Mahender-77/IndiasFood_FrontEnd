import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/seo/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { Eye, EyeOff, Lock, Phone, User, Mail, ArrowLeft } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface GuestCartItem {
  productId: string;
  variantIndex: number;
  quantity: number;
}

const mergeGuestCartWithUserCart = async () => {
  const guestCart = localStorage.getItem('cartItems');
  let cartItems: GuestCartItem[] = [];
  try {
    cartItems = guestCart ? JSON.parse(guestCart) : [];
  } catch (error) {
    console.error("Failed to parse guest cart from localStorage:", error);
    cartItems = [];
  }

  if (cartItems.length > 0) {
    try {
      await api.post('/cart/merge', { guestCartItems: cartItems });
      localStorage.removeItem('cartItems');
    } catch (error) {
      console.error("Failed to merge guest cart:", error);
      // Optionally, handle error more gracefully, e.g., show a toast
    }
  }
};

type AuthMode = 'login' | 'register' | 'forgotPassword' | 'loginWithOtp';
type RegisterStep = 'details' | 'otp' | 'password';
type ForgotPasswordStep = 'phone' | 'otp' | 'newPassword';
type LoginOtpStep = 'phone' | 'otp';

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [registerStep, setRegisterStep] = useState<RegisterStep>('details');
  const [forgotPasswordStep, setForgotPasswordStep] = useState<ForgotPasswordStep>('phone');
  const [loginOtpStep, setLoginOtpStep] = useState<LoginOtpStep>('phone');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation(); // Initialize useLocation
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Validate phone number
  const isValidPhone = (phone: string) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  };

  // Validate email
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0];
    }

    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newOtpValues = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtpValues(newOtpValues);
    
    // Focus last filled input
    const lastFilledIndex = Math.min(pastedData.length, 5);
    otpInputRefs.current[lastFilledIndex]?.focus();
  };

  // Handle OTP backspace
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Get OTP string
  const getOtpString = () => otpValues.join('');

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    });
    setOtpValues(['', '', '', '', '', '']);
    setRegisterStep('details');
    setForgotPasswordStep('phone');
    setLoginOtpStep('phone');
    setCountdown(0);
  };

  // Check if back button should be shown
  const shouldShowBackButton = (): boolean => {
    // Don't show back button on login page
    if (mode === 'login') return false;
    
    // Don't show back button on first step of registration
    if (mode === 'register' && registerStep === 'details') return false;
    
    // Show back button for all other cases
    return true;
  };

  // Handle back button click
  const handleBackClick = () => {
    if (mode === 'register' && registerStep !== 'details') {
      if (registerStep === 'otp') {
        setRegisterStep('details');
      } else {
        setRegisterStep('otp');
      }
    } else if (mode === 'forgotPassword' && forgotPasswordStep !== 'phone') {
      if (forgotPasswordStep === 'otp') {
        setForgotPasswordStep('phone');
      } else {
        setForgotPasswordStep('otp');
      }
    } else if (mode === 'loginWithOtp' && loginOtpStep !== 'phone') {
      setLoginOtpStep('phone');
    } else {
      resetForm();
      setMode('login');
    }
  };

  // ---------------- LOGIN WITH PASSWORD ----------------
  const handleLogin = async () => {
    if (!formData.phone || !formData.password) {
      toast({
        title: 'Error',
        description: 'Phone and password are required',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', {
        phone: formData.phone,
        password: formData.password,
      });
      login(res.data.token);
      toast({ title: 'Welcome back!' });
      await mergeGuestCartWithUserCart();
      const from = (location.state as { from: string })?.from || '/';
      navigate(from);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Login failed',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- SEND OTP (REGISTER) ----------------
  const sendRegisterOtp = async () => {
    if (!formData.name || !formData.email || !formData.phone) {
      toast({
        title: 'Error',
        description: 'All fields are required',
        variant: 'destructive',
      });
      return;
    }

    if (!isValidEmail(formData.email)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email',
        variant: 'destructive',
      });
      return;
    }

    if (!isValidPhone(formData.phone)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid 10-digit phone number',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
     await api.post('/auth/send-otp', {
        phone: formData.phone,
        type: 'register',
      });
      toast({
        title: 'OTP Sent',
        description: 'Please check your phone for the OTP',
      });
      setRegisterStep('otp');
      setCountdown(60);
      setOtpValues(['', '', '', '', '', '']);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to send OTP',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- RESEND OTP (REGISTER) ----------------
  const resendRegisterOtp = async () => {
    setIsLoading(true);
    try {
      await api.post('/auth/send-otp', {
        phone: formData.phone,
        type: 'register',
      });
      
      toast({
        title: 'OTP Resent',
        description: 'A new OTP has been sent to your phone',
      });
      setCountdown(60);
      setOtpValues(['', '', '', '', '', '']);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to resend OTP',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- VERIFY OTP (REGISTER) ----------------
  const verifyRegisterOtp = async () => {
    const otp = getOtpString();
    if (otp.length !== 6) {
      toast({
        title: 'Error',
        description: 'Please enter complete OTP',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/verify-otp', {
        phone: formData.phone,
        otp,
      });
      toast({ title: 'OTP Verified Successfully' });
      setRegisterStep('password');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Invalid OTP',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- REGISTER ----------------
  const handleRegister = async () => {
    if (!formData.password || !formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Please enter password',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/register', {
        username: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
      
      toast({
        title: 'Account Created Successfully!',
        description: 'Please login to continue',
      });
      
      resetForm();
      setMode('login');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Registration failed',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- SEND OTP (LOGIN WITH OTP) ----------------
  const sendLoginOtp = async () => {
    if (!formData.phone || !isValidPhone(formData.phone)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid 10-digit phone number',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/send-otp', {
        phone: formData.phone,
        type: 'login',
      });
      
      toast({
        title: 'OTP Sent',
        description: 'Please check your phone for the OTP',
      });
      setLoginOtpStep('otp');
      setCountdown(60);
      setOtpValues(['', '', '', '', '', '']);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to send OTP',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- VERIFY OTP (LOGIN WITH OTP) ----------------
  const verifyLoginOtp = async () => {
    const otp = getOtpString();
    if (otp.length !== 6) {
      toast({
        title: 'Error',
        description: 'Please enter complete OTP',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/auth/login-with-otp', {
        phone: formData.phone,
        otp,
      });
      login(res.data.token);
      toast({ title: 'Welcome back!' });
      await mergeGuestCartWithUserCart();
      const from = (location.state as { from: string })?.from || '/';
      navigate(from);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Invalid OTP',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- SEND OTP (FORGOT PASSWORD) ----------------
  const sendForgotPasswordOtp = async () => {
    if (!formData.phone || !isValidPhone(formData.phone)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid 10-digit phone number',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/send-otp', {
        phone: formData.phone,
        type: 'forgot',
      });
      
      toast({
        title: 'OTP Sent',
        description: 'Please check your phone for the OTP',
      });
      setForgotPasswordStep('otp');
      setCountdown(60);
      setOtpValues(['', '', '', '', '', '']);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to send OTP',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- VERIFY OTP (FORGOT PASSWORD) ----------------
  const verifyForgotPasswordOtp = async () => {
    const otp = getOtpString();
    if (otp.length !== 6) {
      toast({
        title: 'Error',
        description: 'Please enter complete OTP',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/verify-otp', {
        phone: formData.phone,
        otp,
      });
      toast({ title: 'OTP Verified' });
      setForgotPasswordStep('newPassword');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Invalid OTP',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- RESET PASSWORD ----------------
  const handleResetPassword = async () => {
    if (!formData.password || !formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Please enter password',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
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
        phone: formData.phone,
        password: formData.password,
      });
      
      toast({
        title: 'Password Reset Successful',
        description: 'Please login with your new password',
        variant: "success",
      });
      
      resetForm();
      setMode('login');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to reset password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- RESEND OTP ----------------
  const handleResendOtp = () => {
    if (mode === 'register') {
      resendRegisterOtp();
    }
    else if (mode === 'loginWithOtp') {
      sendLoginOtp();
    }
    else if (mode === 'forgotPassword') {
      sendForgotPasswordOtp();
    }
  };

  // Get title based on mode
  const getTitle = () => {
    switch (mode) {
      case 'login':
        return 'Welcome Back';
      case 'register':
        return 'Create Account';
      case 'forgotPassword':
        return 'Reset Password';
      case 'loginWithOtp':
        return 'Login with OTP';
      default:
        return 'Authentication';
    }
  };

  // Get subtitle based on mode
  const getSubtitle = () => {
    switch (mode) {
      case 'login':
        return 'Sign in to your account';
      case 'register':
        if (registerStep === 'details') return 'Enter your details to get started';
        if (registerStep === 'otp') return 'Enter the OTP sent to your phone';
        return 'Set up your password';
      case 'forgotPassword':
        if (forgotPasswordStep === 'phone') return 'Enter your phone number';
        if (forgotPasswordStep === 'otp') return 'Enter the OTP sent to your phone';
        return 'Create a new password';
      case 'loginWithOtp':
        if (loginOtpStep === 'phone') return 'Enter your phone number';
        return 'Enter the OTP sent to your phone';
      default:
        return '';
    }
  };

  return (
    <Layout>
      <SEO 
        title={getTitle()} 
        description={getSubtitle()}
      />
      <div className="h-70% flex items-center justify-center bg-cream-50 px-6 sm:px-6 py-6 sm:py-12 mt-10 ">
        <div className="w-full max-w-md ">
          {/* Card */}
          <div className="bg-cream rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-5 sm:p-8 border border-cream-100 ">
            {/* Back Button */}
            {shouldShowBackButton() && (
              <button
                onClick={handleBackClick}
                className="mb-4 sm:mb-5 flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors "
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back</span>
              </button>
            )}

            {/* Header */}
            <div className="text-center mb-5 sm:mb-7 ">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1.5">
                {getTitle()}
              </h1>
              <p className="text-sm text-gray-600">{getSubtitle()}</p>
            </div>

            {/* ---------------- LOGIN WITH PASSWORD ---------------- */}
            {mode === 'login' && (
              <div className="space-y-4 sm:space-y-5 ">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })
                      }
                      placeholder="10-digit number"
                      className="pl-10 h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder="Enter password"
                      className="pl-10 pr-10 h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleLogin}
                  disabled={isLoading || !formData.phone || !formData.password}
                  className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-md transition-all text-sm"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>

                {/* Additional Options */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-0 text-xs sm:text-sm">
                  <button
                    onClick={() => {
                      resetForm();
                      setMode('forgotPassword');
                    }}
                    className="text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Forgot Password?
                  </button>
                  <button
                    onClick={() => {
                      resetForm();
                      setMode('loginWithOtp');
                    }}
                    className="text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Login with OTP
                  </button>
                </div>

                {/* Toggle to Register */}
                <div className="text-center pt-3 sm:pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <button
                      onClick={() => {
                        resetForm();
                        setMode('register');
                      }}
                      className="text-orange-600 hover:text-orange-700 font-semibold"
                    >
                      Sign Up
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* ---------------- REGISTER - STEP 1: DETAILS ---------------- */}
            {mode === 'register' && registerStep === 'details' && (
              <div className="space-y-3.5 sm:space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your full name"
                      className="pl-10 h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                      className="pl-10 h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-phone" className="text-sm font-medium text-gray-700">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="reg-phone"
                      type="tel"
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })
                      }
                      placeholder="10-digit number"
                      className="pl-10 h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500 text-sm"
                    />
                  </div>
                </div>

                <Button
                  onClick={sendRegisterOtp}
                  disabled={
                    isLoading ||
                    !formData.name ||
                    !formData.email ||
                    !isValidPhone(formData.phone) ||
                    !isValidEmail(formData.email)
                  }
                  className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isLoading ? 'Sending OTP...' : 'Send OTP'}
                </Button>

                {/* Toggle to Login */}
                <div className="text-center pt-3 sm:pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <button
                      onClick={() => {
                        resetForm();
                        setMode('login');
                      }}
                      className="text-orange-600 hover:text-orange-700 font-semibold"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* ---------------- REGISTER - STEP 2: OTP ---------------- */}
            {mode === 'register' && registerStep === 'otp' && (
              <div className="space-y-4 sm:space-y-5">
                {/* Phone Display */}
                <div className="bg-cream-50 border border-cream-200 rounded-lg p-3">
                  <p className="text-xs text-gray-700">
                    OTP sent to <span className="font-semibold">+91 {formData.phone}</span>
                  </p>
                </div>

                {/* OTP Input Boxes */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">
                    Enter 6-Digit OTP
                  </Label>
                  <div className="flex gap-1.5 sm:gap-2 justify-between">
                    {otpValues.map((value, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpInputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={value}
                        onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={index === 0 ? handleOtpPaste : undefined}
                        className="w-11 h-12 sm:w-12 sm:h-13 text-center text-lg font-semibold border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all"
                      />
                    ))}
                  </div>
                </div>

                {/* Resend OTP */}
                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-xs text-gray-600">
                      Resend OTP in <span className="font-semibold text-orange-600">{countdown}s</span>
                    </p>
                  ) : (
                    <button
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      className="text-xs sm:text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <Button
                  onClick={verifyRegisterOtp}
                  disabled={isLoading || getOtpString().length !== 6}
                  className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-md transition-all text-sm"
                >
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </Button>
              </div>
            )}

            {/* ---------------- REGISTER - STEP 3: PASSWORD ---------------- */}
            {mode === 'register' && registerStep === 'password' && (
              <div className="space-y-4 sm:space-y-5">
                {/* Success Message */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <p className="text-xs text-emerald-800 font-medium">
                    ✓ Phone number verified successfully
                  </p>
                </div>

                {/* Phone Display (read-only) */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="tel"
                      value={formData.phone}
                      disabled
                      className="pl-10 h-11 bg-cream-50 border-cream-200 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Min 6 characters"
                      className="pl-10 pr-10 h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, confirmPassword: e.target.value })
                      }
                      placeholder="Re-enter password"
                      className="pl-10 pr-10 h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleRegister}
                  disabled={
                    isLoading ||
                    !formData.password ||
                    !formData.confirmPassword ||
                    formData.password !== formData.confirmPassword
                  }
                  className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-md transition-all text-sm"
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </div>
            )}

            {/* ---------------- FORGOT PASSWORD - STEP 1: PHONE ---------------- */}
            {mode === 'forgotPassword' && forgotPasswordStep === 'phone' && (
              <div className="space-y-4 sm:space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="forgot-phone" className="text-sm font-medium text-gray-700">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="forgot-phone"
                      type="tel"
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })
                      }
                      placeholder="Registered number"
                      className="pl-10 h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500 text-sm"
                    />
                  </div>
                </div>

                <Button
                  onClick={sendForgotPasswordOtp}
                  disabled={isLoading || !isValidPhone(formData.phone)}
                  className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-md transition-all text-sm"
                >
                  {isLoading ? 'Sending OTP...' : 'Send OTP'}
                </Button>
              </div>
            )}

            {/* ---------------- FORGOT PASSWORD - STEP 2: OTP ---------------- */}
            {mode === 'forgotPassword' && forgotPasswordStep === 'otp' && (
              <div className="space-y-4 sm:space-y-5">
                <div className="bg-cream-50 border border-cream-200 rounded-lg p-3">
                  <p className="text-xs text-gray-700">
                    OTP sent to <span className="font-semibold">+91 {formData.phone}</span>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">
                    Enter 6-Digit OTP
                  </Label>
                  <div className="flex gap-1.5 sm:gap-2 justify-between">
                    {otpValues.map((value, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpInputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={value}
                        onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={index === 0 ? handleOtpPaste : undefined}
                        className="w-11 h-12 sm:w-12 sm:h-13 text-center text-lg font-semibold border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all"
                      />
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-xs text-gray-600">
                      Resend OTP in <span className="font-semibold text-orange-600">{countdown}s</span>
                    </p>
                  ) : (
                    <button
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      className="text-xs sm:text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <Button
                  onClick={verifyForgotPasswordOtp}
                  disabled={isLoading || getOtpString().length !== 6}
                  className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-md transition-all text-sm"
                >
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </Button>
              </div>
            )}

            {/* ---------------- FORGOT PASSWORD - STEP 3: NEW PASSWORD ---------------- */}
            {mode === 'forgotPassword' && forgotPasswordStep === 'newPassword' && (
              <div className="space-y-4 sm:space-y-5">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <p className="text-xs text-emerald-800 font-medium">
                    ✓ OTP verified successfully
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="new-password" className="text-sm font-medium text-gray-700">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Min 6 characters"
                      className="pl-10 pr-10 h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-new-password" className="text-sm font-medium text-gray-700">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="confirm-new-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, confirmPassword: e.target.value })
                      }
                      placeholder="Re-enter password"
                      className="pl-10 pr-10 h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleResetPassword}
                  disabled={
                    isLoading ||
                    !formData.password ||
                    !formData.confirmPassword ||
                    formData.password !== formData.confirmPassword
                  }
                  className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-md transition-all text-sm"
                >
                  {isLoading ? 'Resetting Password...' : 'Reset Password'}
                </Button>
              </div>
            )}

            {/* ---------------- LOGIN WITH OTP - STEP 1: PHONE ---------------- */}
            {mode === 'loginWithOtp' && loginOtpStep === 'phone' && (
              <div className="space-y-4 sm:space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="otp-login-phone" className="text-sm font-medium text-gray-700">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="otp-login-phone"
                      type="tel"
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })
                      }
                      placeholder="10-digit number"
                      className="pl-10 h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500 text-sm"
                    />
                  </div>
                </div>

                <Button
                  onClick={sendLoginOtp}
                  disabled={isLoading || !isValidPhone(formData.phone)}
                  className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-md transition-all text-sm"
                >
                  {isLoading ? 'Sending OTP...' : 'Send OTP'}
                </Button>
              </div>
            )}

            {/* ---------------- LOGIN WITH OTP - STEP 2: OTP ---------------- */}
            {mode === 'loginWithOtp' && loginOtpStep === 'otp' && (
              <div className="space-y-4 sm:space-y-5">
                <div className="bg-cream-50 border border-cream-200 rounded-lg p-3">
                  <p className="text-xs text-gray-700">
                    OTP sent to <span className="font-semibold">+91 {formData.phone}</span>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">
                    Enter 6-Digit OTP
                  </Label>
                  <div className="flex gap-1.5 sm:gap-2 justify-between">
                    {otpValues.map((value, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpInputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={value}
                        onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={index === 0 ? handleOtpPaste : undefined}
                        className="w-11 h-12 sm:w-12 sm:h-13 text-center text-lg font-semibold border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all"
                      />
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-xs text-gray-600">
                      Resend OTP in <span className="font-semibold text-orange-600">{countdown}s</span>
                    </p>
                  ) : (
                    <button
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      className="text-xs sm:text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <Button
                  onClick={verifyLoginOtp}
                  disabled={isLoading || getOtpString().length !== 6}
                  className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-md transition-all text-sm"
                >
                  {isLoading ? 'Verifying...' : 'Verify & Login'}
                </Button>
              </div>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 mt-5 sm:mt-6 px-4">
            By continuing, you agree to our{' '}
            <a href="/terms" className="text-orange-600 hover:text-orange-700 font-medium">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-orange-600 hover:text-orange-700 font-medium">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Auth;