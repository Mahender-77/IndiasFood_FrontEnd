import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Home, MapPin, Globe } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { auth } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneStep, setPhoneStep] = useState<'phone' | 'otp'>('phone');
  const confirmationResultRef = useRef<any>(null);
  const { toast } = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (authMethod === 'email') {
        if (isLogin) {
          const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
          const idToken = await userCredential.user.getIdToken();
          login(idToken);
          toast({
            title: 'Welcome back!',
            description: 'You have successfully logged in.',
          });
          navigate('/');
        } else {
          if (formData.password !== formData.confirmPassword) {
            toast({
              title: 'Error',
              description: 'Passwords do not match.',
              variant: 'destructive',
            });
            setIsLoading(false);
            return;
          }

          const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
          const idToken = await userCredential.user.getIdToken();

          await api.post(`/auth/register`, {
            uid: userCredential.user.uid,
            username: formData.username,
            email: formData.email,
            addresses: [
              {
                address: formData.address,
                city: formData.city,
                postalCode: formData.postalCode,
                country: formData.country,
              },
            ],
          });
          login(idToken);
          toast({
            title: 'Account created!',
            description: 'You have successfully registered and logged in.',
          });
          navigate('/');
        }
      } else if (authMethod === 'phone') {
        if (phoneStep === 'phone') {
          // Send OTP
          const appVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': (response: any) => {
              // reCAPTCHA solved, allow signInWithPhoneNumber.
              // console.log('reCAPTCHA response:', response);
            },
            'expired-callback': () => {
              toast({
                title: 'Error',
                description: 'reCAPTCHA expired. Please try again.',
                variant: 'destructive',
              });
              setIsLoading(false);
            }
          });
          const confirmationResult = await signInWithPhoneNumber(auth, phone, appVerifier);
          confirmationResultRef.current = confirmationResult;
          setPhoneStep('otp');
          toast({
            title: 'OTP Sent',
            description: `OTP sent to ${phone}.`,
          });
        } else if (phoneStep === 'otp') {
          // Verify OTP
          if (!confirmationResultRef.current) {
            toast({
              title: 'Error',
              description: 'OTP not sent. Please try again.',
              variant: 'destructive',
            });
            setIsLoading(false);
            return;
          }
          const userCredential = await confirmationResultRef.current.confirm(otp);
          const idToken = await userCredential.user.getIdToken();
          login(idToken);
          toast({
            title: 'Logged in via Phone OTP',
            description: 'You have successfully logged in.',
          });
          navigate('/');
        }
      }
    } catch (error: any) {
      let errorMessage = 'Something went wrong.';
      if (error.code) {
        switch (error.code) {
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This user account has been disabled.';
            break;
          case 'auth/user-not-found':
            errorMessage = 'No user found with this email.';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password.';
            break;
          case 'auth/email-already-in-use':
            errorMessage = 'The email address is already in use by another account.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password should be at least 6 characters.';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Email/password accounts are not enabled.';
            break;
          case 'auth/invalid-phone-number':
            errorMessage = 'Invalid phone number format.';
            break;
          case 'auth/missing-phone-number':
            errorMessage = 'Phone number is missing.';
            break;
          case 'auth/quota-exceeded':
            errorMessage = 'SMS quota exceeded for this project. Please try again later.';
            break;
          case 'auth/captcha-check-failed':
            errorMessage = 'reCAPTCHA verification failed. Please try again.';
            break;
          case 'auth/code-expired':
            errorMessage = 'The verification code has expired.';
            break;
          case 'auth/invalid-verification-code':
            errorMessage = 'The verification code is invalid.';
            break;
          default:
            errorMessage = error.message; // Fallback to Firebase error message
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message; // Backend error message
      }
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  return (
    <Layout>
      <section className="section-padding bg-cream min-h-[calc(100vh-200px)] flex items-center">
        <div className="container-custom">
          <div className={isLogin ? "max-w-md mx-auto" : "max-w-4xl mx-auto"}>
            <div className="bg-card rounded-2xl shadow-medium p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                  {isLogin ? 'Welcome Back' : 'Create Account'}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {isLogin
                    ? 'Sign in to continue ordering delicious sweets'
                    : 'Join us for fresh Indian sweets delivered to your door'}
                </p>
              </div>

              <div className="flex bg-muted rounded-lg p-1 mb-6">
                <button
                  className={`flex-1 p-3 rounded-md font-medium ${authMethod === 'email' ? 'bg-background shadow-sm' : ''}`}
                  onClick={() => setAuthMethod('email')}
                >
                  📧 Email / Password
                </button>
                <button
                  className={`flex-1 p-3 rounded-md font-medium ${authMethod === 'phone' ? 'bg-background shadow-sm' : ''}`}
                  onClick={() => setAuthMethod('phone')}
                >
                  📱 Phone OTP
                </button>
              </div>

              {/* Form */} 
              <form onSubmit={handleSubmit} className="space-y-4">
                {authMethod === 'email' && (
                  <>
                    {!isLogin && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      </div>
                    )}

                    {isLogin && (
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
                    )}

                    {!isLogin && (
                      <>
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
                      </>
                    )}

                    <div className={!isLogin ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-2"}>
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
                                setFormData({
                                  ...formData,
                                  confirmPassword: e.target.value,
                                })
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
                  </div>

                  {isLogin && (
                    <div className="text-right">
                      <Link
                        to="/forgot-password"
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  )}
                  </>
                )}

                {authMethod === 'phone' && (
                  <>
                    {phoneStep === 'phone' && (
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="relative">
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="e.g., +919876543210"
                            className="pl-3"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    )}

                    {phoneStep === 'otp' && (
                      <div className="space-y-2">
                        <Label htmlFor="otp">Verification Code (OTP)</Label>
                        <div className="relative">
                          <Input
                            id="otp"
                            type="text"
                            placeholder="Enter OTP"
                            className="pl-3"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                          />
                        </div>
                        <Button variant="link" onClick={() => setPhoneStep('phone')} disabled={isLoading}>Edit Phone Number</Button>
                      </div>
                    )}
                  </>
                )}

                <div id="recaptcha-container" className="mt-4"></div>

                <Button
                  type="submit"
                  size="lg"
                  variant="hero"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading
                    ? 'Please wait...'
                    : authMethod === 'email'
                    ? isLogin
                      ? 'Sign In'
                      : 'Create Account'
                    : phoneStep === 'phone'
                      ? 'Send OTP'
                      : 'Verify OTP'}
                </Button>
              </form>

            {/* Toggle */}
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                {isLogin
                  ? "Don't have an account?"
                  : 'Already have an account?'}
              </span>{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  if (authMethod === 'phone') {
                    setPhoneStep('phone'); // Reset phone step when switching auth method
                  }
                }}
                className="text-primary font-medium hover:underline"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Auth;
