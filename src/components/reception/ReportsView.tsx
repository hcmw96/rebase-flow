import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface ReportsViewProps {
  userRole: string;
}

const ReportsView: React.FC<ReportsViewProps> = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Reports & Analytics
        </CardTitle>
        <CardDescription>
          Reports will be available once the database is configured.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center py-12 text-muted-foreground">
        Coming soon...
      </CardContent>
    </Card>
  );
};

export default ReportsView;
