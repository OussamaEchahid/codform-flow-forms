
import React from 'react';
import AppSidebar from '@/components/layout/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ChevronDown } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { format } from 'date-fns';

const Orders = () => {
  const { user } = useAuth();

  // Sample orders data
  const orders = [
    {
      id: 'ORD-001',
      customer: 'Ahmed Mohamed',
      product: 'Premium Watch',
      date: new Date('2025-03-15'),
      price: 1299,
      status: 'delivered'
    },
    {
      id: 'ORD-002',
      customer: 'Fatima Ali',
      product: 'Wireless Headphones',
      date: new Date('2025-04-10'),
      price: 599,
      status: 'processing'
    },
    {
      id: 'ORD-003',
      customer: 'Omar Hassan',
      product: 'Smartphone Case',
      date: new Date('2025-04-18'),
      price: 149,
      status: 'pending'
    },
    {
      id: 'ORD-004',
      customer: 'Sara Ahmad',
      product: 'Electric Kettle',
      date: new Date('2025-04-22'),
      price: 349,
      status: 'cancelled'
    }
  ];

  // Status badge colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return <div className="text-center py-8">Please login to access the orders dashboard</div>;
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Orders</h1>
              <p className="text-gray-600">Manage and track your customer orders</p>
            </div>
            <Button className="bg-[#9b87f5] hover:bg-[#7E69AB]">
              <ShoppingCart className="mr-2 h-4 w-4" />
              New Order
            </Button>
          </div>

          <Card className="mb-8">
            <CardHeader className="pb-2">
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell>{order.product}</TableCell>
                      <TableCell>{format(order.date, 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{order.price} MAD</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Orders;
