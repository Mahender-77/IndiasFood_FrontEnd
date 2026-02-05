import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

const Profile = () => {
  const { user, loading: authLoading, error: authError, isAdmin } = useAuth();

  if (authLoading) {
    return (
      <Layout>
        <section className="section-padding bg-cream min-h-[calc(100vh-200px)] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
            <h2 className="font-display text-xl font-semibold mt-4 text-gray-700">Loading Profile</h2>
            <p className="text-gray-500 mt-2">Please wait while we fetch your information...</p>
          </div>
        </section>
      </Layout>
    );
  }

  if (authError) {
    return (
      <Layout>
        <section className="section-padding bg-cream min-h-[calc(100vh-200px)] flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold mb-4">Error</h1>
            <p className="text-red-500 mb-4">{authError}</p>
            <Link to="/login">
              <Button>Login Again</Button>
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <section className="section-padding bg-cream min-h-[calc(100vh-200px)] flex items-center justify-center">
          <p>Please log in to view your profile.</p>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="section-padding bg-cream min-h-[calc(100vh-200px)]">
        <div className="container-custom">
          <h1 className="font-display text-3xl font-bold mb-8">User Profile</h1>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Username:</strong> {user.username}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Admin:</strong> {isAdmin ? 'Yes' : 'No'}</p>
                {user.role === 'delivery' && user.deliveryProfile && user.deliveryProfile.status && (
                  <div>
                    <p><strong>Delivery Status:</strong> {user.deliveryProfile.status === 'approved' ? (
                      <span className="text-green-600">✅ Approved - <Link to="/delivery" className="text-blue-600 hover:underline">Go to Delivery Dashboard</Link></span>
                    ) : (
                      <span className="text-yellow-600">⏳ Pending - Admin reviewing</span>
                    )}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {user.addresses && user.addresses.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Addresses</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user.addresses.map((addr, index) => (
                    <div key={index} className="border-b pb-2 last:border-b-0">
                      <p>{addr.address}</p>
                      <p>{addr.city}, {addr.postalCode}</p>
                      <p>{addr.country}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Addresses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No addresses found.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Profile;
