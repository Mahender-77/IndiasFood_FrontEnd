import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from '@/types';
import { Link } from 'react-router-dom';
import { User2 } from 'lucide-react';

interface AdminCustomerCardProps {
  customer: User & { totalOrders: number };
}

export function AdminCustomerCard({ customer }: AdminCustomerCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{customer.name}</CardTitle>
        <User2 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{customer.email}</div>
        <p className="text-xs text-muted-foreground">
          Total Orders: {customer.totalOrders}
        </p>
        <Link to={`/admin/customers/${customer._id}`} className="text-primary text-sm hover:underline mt-2 inline-block">
          View Details
        </Link>
      </CardContent>
    </Card>
  );
}

