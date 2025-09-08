import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, User, CreditCard, Activity, Settings } from "lucide-react";

const Dashboard = () => {
  const [user] = useState({
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    membershipType: "Resident",
    joinDate: "January 2024"
  });

  const upcomingBookings = [
    {
      id: 1,
      service: "Contrast Therapy",
      date: "2024-01-25",
      time: "10:00 AM",
      duration: "60 min",
      status: "confirmed"
    },
    {
      id: 2,
      service: "Breathwork Class",
      date: "2024-01-27",
      time: "6:00 PM",
      duration: "45 min",
      status: "confirmed"
    }
  ];

  const recentActivity = [
    {
      service: "Cryotherapy",
      date: "2024-01-20",
      rating: 5
    },
    {
      service: "IV Vitamin Therapy",
      date: "2024-01-18",
      rating: 5
    },
    {
      service: "Traditional Sauna",
      date: "2024-01-15",
      rating: 4
    }
  ];

  const membershipBenefits = {
    "Resident": {
      cryotherapy: "Unlimited",
      classes: "8 monthly",
      privateSuite: "3 monthly",
      hbot: "3 monthly",
      communalSuite: "Unlimited",
      discount: "10%",
      guestPasses: "12 annually"
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="pt-20">
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-12">
              <h1 className="text-4xl font-serif font-light text-foreground mb-4">
                Welcome back, <span className="text-primary">{user.name}</span>
              </h1>
              <p className="text-foreground/70">
                Manage your bookings, track your progress, and discover new wellness experiences.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <Card className="card-luxury text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-primary mb-1">2</div>
                  <div className="text-sm text-foreground/60">Upcoming Sessions</div>
                </CardContent>
              </Card>

              <Card className="card-luxury text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-primary mb-1">12</div>
                  <div className="text-sm text-foreground/60">Sessions This Month</div>
                </CardContent>
              </Card>

              <Card className="card-luxury text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-primary mb-1">{user.membershipType}</div>
                  <div className="text-sm text-foreground/60">Membership</div>
                </CardContent>
              </Card>

              <Card className="card-luxury text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-primary mb-1">24h</div>
                  <div className="text-sm text-foreground/60">Total Wellness Time</div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="bookings" className="space-y-8">
              <TabsList className="grid w-full grid-cols-4 bg-card/50">
                <TabsTrigger value="bookings">Bookings</TabsTrigger>
                <TabsTrigger value="membership">Membership</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
              </TabsList>

              <TabsContent value="bookings" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Upcoming Bookings */}
                  <Card className="card-luxury">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Upcoming Sessions
                        <Button size="sm" className="btn-luxury">
                          Book New Session
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {upcomingBookings.map((booking) => (
                        <div key={booking.id} className="p-4 bg-background/50 rounded-lg border border-border/50">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-foreground">{booking.service}</h4>
                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-foreground/70">
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {booking.date}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {booking.time}
                            </span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card className="card-luxury">
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full btn-luxury justify-start">
                        <Calendar className="h-4 w-4 mr-2" />
                        Book a Session
                      </Button>
                      <Button variant="outline" className="w-full btn-ghost-luxury justify-start">
                        <Clock className="h-4 w-4 mr-2" />
                        Reschedule Booking
                      </Button>
                      <Button variant="outline" className="w-full btn-ghost-luxury justify-start">
                        <User className="h-4 w-4 mr-2" />
                        Invite a Friend
                      </Button>
                      <Button variant="outline" className="w-full btn-ghost-luxury justify-start">
                        <Settings className="h-4 w-4 mr-2" />
                        Preferences
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="membership" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="card-luxury">
                    <CardHeader>
                      <CardTitle>Membership Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Plan:</span>
                        <span className="font-medium text-primary">{user.membershipType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Member since:</span>
                        <span className="font-medium">{user.joinDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Next billing:</span>
                        <span className="font-medium">February 1, 2024</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="card-luxury">
                    <CardHeader>
                      <CardTitle>Your Benefits</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(membershipBenefits[user.membershipType as keyof typeof membershipBenefits]).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-foreground/70 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                          <span className="font-medium text-primary">{String(value)}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="activity" className="space-y-6">
                <Card className="card-luxury">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity, index) => (
                        <div key={index} className="flex justify-between items-center p-4 bg-background/50 rounded-lg border border-border/50">
                          <div>
                            <h4 className="font-medium text-foreground">{activity.service}</h4>
                            <p className="text-sm text-foreground/70">{activity.date}</p>
                          </div>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <span 
                                key={i}
                                className={`text-lg ${i < activity.rating ? 'text-primary' : 'text-muted'}`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="profile" className="space-y-6">
                <Card className="card-luxury">
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-foreground/70">Full Name</label>
                        <p className="font-medium">{user.name}</p>
                      </div>
                      <div>
                        <label className="text-sm text-foreground/70">Email</label>
                        <p className="font-medium">{user.email}</p>
                      </div>
                    </div>
                    <Button className="btn-luxury">
                      Edit Profile
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;