import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface ClientManagementProps {
  userRole: string;
}

const ClientManagement: React.FC<ClientManagementProps> = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Client Management
        </CardTitle>
        <CardDescription>
          Client management will be available once the database is configured.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center py-12 text-muted-foreground">
        Coming soon...
      </CardContent>
    </Card>
  );
};

export default ClientManagement;
