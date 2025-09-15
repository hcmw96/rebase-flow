import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, TrendingUp, DollarSign, Users, Package, Download } from 'lucide-react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'admin' | 'manager' | 'receptionist' | 'practitioner';

interface ReportsViewProps {
  userRole: UserRole;
}

const ReportsView: React.FC<ReportsViewProps> = ({ userRole }) => {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState('today');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    revenue: 0,
    bookings: 0,
    clients: 0,
    completionRate: 0,
    topServices: [],
    recentTransactions: [],
    staffPerformance: []
  });

  useEffect(() => {
    fetchReportData();
  }, [dateRange, selectedDate]);

  const getDateRangeForQuery = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (dateRange) {
      case 'today':
        startDate = startOfDay(selectedDate);
        endDate = endOfDay(selectedDate);
        break;
      case 'week':
        startDate = startOfWeek(selectedDate);
        endDate = endOfWeek(selectedDate);
        break;
      case 'month':
        startDate = startOfMonth(selectedDate);
        endDate = endOfMonth(selectedDate);
        break;
      default:
        startDate = startOfDay(selectedDate);
        endDate = endOfDay(selectedDate);
    }

    return { startDate, endDate };
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRangeForQuery();

      // Fetch revenue data
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, created_at, payment_method, clients(first_name, last_name)')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Fetch bookings data
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*, services(name), staff(first_name, last_name), clients(first_name, last_name)')
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .order('start_time', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Calculate metrics
      const revenue = payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
      const totalBookings = bookings?.length || 0;
      const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;
      const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

      // Unique clients
      const uniqueClients = new Set(bookings?.map(b => b.client_id)).size;

      // Top services
      const serviceCount: Record<string, number> = {};
      bookings?.forEach(booking => {
        const serviceName = booking.services?.name;
        if (serviceName) {
          serviceCount[serviceName] = (serviceCount[serviceName] || 0) + 1;
        }
      });

      const topServices = Object.entries(serviceCount)
        .map(([name, count]) => ({ name, bookings: count }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5);

      // Staff performance
      const staffCount: Record<string, { bookings: number; revenue: number }> = {};
      bookings?.forEach(booking => {
        if (booking.staff) {
          const staffName = `${booking.staff.first_name} ${booking.staff.last_name}`;
          if (!staffCount[staffName]) {
            staffCount[staffName] = { bookings: 0, revenue: 0 };
          }
          staffCount[staffName].bookings += 1;
          if (booking.price) {
            staffCount[staffName].revenue += Number(booking.price);
          }
        }
      });

      const staffPerformance = Object.entries(staffCount)
        .map(([name, stats]) => ({ name, bookings: stats.bookings, revenue: stats.revenue }))
        .sort((a, b) => b.revenue - a.revenue);

      setReportData({
        revenue,
        bookings: totalBookings,
        clients: uniqueClients,
        completionRate,
        topServices,
        recentTransactions: payments?.slice(0, 10) || [],
        staffPerformance
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: "Error",
        description: "Failed to load report data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    // Create CSV content
    const csvContent = [
      ['Report Date', format(new Date(), 'yyyy-MM-dd HH:mm:ss')],
      ['Period', `${dateRange} - ${format(selectedDate, 'yyyy-MM-dd')}`],
      [''],
      ['Summary'],
      ['Total Revenue', `$${reportData.revenue.toFixed(2)}`],
      ['Total Bookings', reportData.bookings],
      ['Unique Clients', reportData.clients],
      ['Completion Rate', `${reportData.completionRate.toFixed(1)}%`],
      [''],
      ['Top Services'],
      ['Service Name', 'Bookings'],
      ...reportData.topServices.map(service => [service.name, service.bookings]),
      [''],
      ['Staff Performance'],
      ['Staff Name', 'Bookings', 'Revenue'],
      ...reportData.staffPerformance.map(staff => [staff.name, staff.bookings, `$${staff.revenue.toFixed(2)}`])
    ];

    const csv = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rebase-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!['admin', 'manager'].includes(userRole)) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              Reports are only available to managers and administrators.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Reports & Analytics</h2>
          <p className="text-muted-foreground">
            Business insights and performance metrics
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                <CalendarDays className="mr-2 h-4 w-4" />
                {format(selectedDate, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button onClick={exportReport} disabled={loading}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">${reportData.revenue.toFixed(2)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                    <p className="text-2xl font-bold">{reportData.bookings}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Unique Clients</p>
                    <p className="text-2xl font-bold">{reportData.clients}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                    <p className="text-2xl font-bold">{reportData.completionRate.toFixed(1)}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Reports */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top Services */}
            <Card>
              <CardHeader>
                <CardTitle>Top Services</CardTitle>
                <CardDescription>Most popular services by booking count</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead className="text-right">Bookings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.topServices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                          No services data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      reportData.topServices.map((service, index) => (
                        <TableRow key={index}>
                          <TableCell>{service.name}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{service.bookings}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Staff Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Staff Performance</CardTitle>
                <CardDescription>Revenue and bookings by staff member</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Member</TableHead>
                      <TableHead className="text-right">Bookings</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.staffPerformance.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No staff performance data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      reportData.staffPerformance.map((staff, index) => (
                        <TableRow key={index}>
                          <TableCell>{staff.name}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{staff.bookings}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${staff.revenue.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.recentTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No recent transactions
                      </TableCell>
                    </TableRow>
                  ) : (
                    reportData.recentTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(new Date(transaction.created_at), 'MMM d, h:mm a')}
                        </TableCell>
                        <TableCell>
                          {transaction.clients ? 
                            `${transaction.clients.first_name} ${transaction.clients.last_name}` : 
                            'Unknown Client'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {transaction.payment_method}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${transaction.amount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ReportsView;