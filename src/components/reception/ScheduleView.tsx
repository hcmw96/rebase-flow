import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';

interface ScheduleViewProps {
  userRole: string;
}

const ScheduleView: React.FC<ScheduleViewProps> = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Schedule
        </CardTitle>
        <CardDescription>
          Scheduling will be available once the database is configured.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center py-12 text-muted-foreground">
        Coming soon...
      </CardContent>
    </Card>
  );
};

export default ScheduleView;
