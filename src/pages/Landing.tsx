import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Car, Calendar, Target, BarChart3, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <Car className="h-24 w-24 text-route66-red text-vintage animate-pulse" />
              <div className="absolute -inset-4 bg-gradient-to-r from-route66-red/20 to-route66-orange/20 rounded-full blur-xl" />
            </div>
          </div>
          
          <h1 className="font-txc-bold text-4xl md:text-6xl text-sunset mb-6 leading-tight">
            Journey Through
            <span className="block text-route66-orange text-vintage">Your Day</span>
          </h1>
          
          <p className="font-txc text-xl md:text-2xl text-foreground mb-8 leading-relaxed">
            Experience scheduling like never before. Your day becomes a road trip,
            <span className="block">with tasks as destinations along the way.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/auth">
              <Button variant="route66" size="lg" className="font-sans font-semibold text-lg tracking-wide">
                Start Your Journey
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="desert" size="lg" className="font-sans font-semibold text-lg tracking-wide">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="vintage-card text-center">
            <Calendar className="h-12 w-12 text-route66-red text-vintage mx-auto mb-4" />
            <h3 className="font-txc-bold text-lg text-sunset mb-3">
              Road Map View
            </h3>
            <p className="font-txc text-muted-foreground">
              Visualize your schedule as a journey with stops for each task and event.
            </p>
          </div>
          
          <div className="vintage-card text-center">
            <Target className="h-12 w-12 text-route66-orange text-vintage mx-auto mb-4" />
            <h3 className="font-txc-bold text-lg text-route66-orange mb-3">
              Goal Tracking
            </h3>
            <p className="font-txc text-muted-foreground">
              Set destinations and track your progress as you complete tasks along the way.
            </p>
          </div>
          
          <div className="vintage-card text-center">
            <BarChart3 className="h-12 w-12 text-route66-red text-vintage mx-auto mb-4" />
            <h3 className="font-txc-bold text-lg text-sunset mb-3">
              Progress Reports
            </h3>
            <p className="font-txc text-muted-foreground">
              View detailed analytics of your daily journeys and accomplishments.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="vintage-card max-w-2xl mx-auto p-8">
            <Zap className="h-16 w-16 text-route66-orange text-vintage mx-auto mb-6" />
            <h2 className="font-txc-bold text-2xl text-sunset mb-4">
              Ready to Hit the Road?
            </h2>
            <p className="font-txc text-lg text-foreground mb-6">
              Transform your productivity with the most unique calendar experience ever created.
            </p>
            <Link to="/auth">
              <Button variant="route66" size="lg" className="font-sans font-semibold text-lg tracking-wide">
                Create Your Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;