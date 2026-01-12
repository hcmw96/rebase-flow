import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

interface PointOfSaleProps {
  userRole: string;
}

const PointOfSale: React.FC<PointOfSaleProps> = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Point of Sale
        </CardTitle>
        <CardDescription>
          Point of sale will be available once the database is configured.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center py-12 text-muted-foreground">
        Coming soon...
      </CardContent>
    </Card>
  );
};

export default PointOfSale;
