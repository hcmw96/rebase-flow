import { useLocation, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Calendar, Clock, User, Mail, Phone } from "lucide-react";
import { format } from "date-fns";

const BookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state;

  if (!booking) {
    navigate("/services");
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="pt-20">
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-serif font-light text-foreground mb-4">
                Booking Confirmed!
              </h1>
              <p className="text-lg text-foreground/70">
                Your appointment has been successfully booked. You'll receive a confirmation email shortly.
              </p>
            </div>

            <Card className="card-luxury text-left mb-8">
              <CardHeader>
                <CardTitle className="text-xl">Booking Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Service</p>
                    <p className="text-foreground/70">{booking.service.title}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Date</p>
                    <p className="text-foreground/70">{format(booking.date, "EEEE, MMMM do, yyyy")}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Time</p>
                    <p className="text-foreground/70">{booking.time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Customer</p>
                    <p className="text-foreground/70">{booking.customer.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-foreground/70">{booking.customer.email}</p>
                  </div>
                </div>

                {booking.customer.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-foreground/70">{booking.customer.phone}</p>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-lg">Total Paid</span>
                    <span className="font-semibold text-lg">£{booking.service.price}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="bg-primary/10 rounded-lg p-4">
                <p className="text-sm text-foreground/70">
                  <strong>What's next?</strong> Please arrive 15 minutes before your appointment time. 
                  If you need to reschedule or cancel, please contact us at least 24 hours in advance.
                </p>
              </div>

              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => navigate("/services")}>
                  Browse More Services
                </Button>
                <Button onClick={() => navigate("/")}>
                  Return Home
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default BookingConfirmation;