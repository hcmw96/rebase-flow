import React from 'react';
import { MindbodyOAuthLogin } from '@/components/MindbodyOAuthLogin';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const Login = () => {
  return (
    <div 
      className="min-h-screen bg-cover bg-left bg-fixed relative"
      style={{
        backgroundImage: `url('/lovable-uploads/397f6034-d62e-4ad3-b98c-30070da1186a.png')`
      }}
    >
      {/* Dark overlay for text legibility */}
      <div className="absolute inset-0 bg-black/60 z-0" />
      
      <div className="relative z-10">
        <Navigation />
        
        <div className="pt-20">
          <section className="pt-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-white mb-4">Welcome Back</h1>
                <p className="text-lg text-white/80 max-w-md mx-auto">
                  Sign in to your Mindbody account to access your bookings, view services, and manage your wellness journey.
                </p>
              </div>
              
              <MindbodyOAuthLogin redirectPath="/services" />
            </div>
          </section>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default Login;