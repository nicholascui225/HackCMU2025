import { Link } from "react-router-dom";
import { Button } from "./button";
import { Car, Calendar, Target, BarChart3, PlusCircle } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

export const Navbar = () => {
  const { user, signOut } = useAuth();
  return (
    <nav className="highway-card border-b border-route66-brown/20 p-4">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <Car className="h-8 w-8 text-route66-red text-vintage" />
          <h1 className="font-sans font-bold text-xl text-sunset tracking-wide">
            Roadmap
          </h1>
        </Link>
        
        <div className="hidden md:flex items-center gap-6">
          <Link 
            to="/dashboard" 
            className="flex items-center gap-2 text-route66-brown hover:text-route66-red transition-colors"
          >
            <Calendar className="h-4 w-4" />
            <span className="font-sans font-medium tracking-wide">Dashboard</span>
          </Link>
          <Link 
            to="/create" 
            className="flex items-center gap-2 text-route66-brown hover:text-route66-red transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="font-sans font-medium tracking-wide">Create</span>
          </Link>
          <Link 
            to="/goals" 
            className="flex items-center gap-2 text-route66-brown hover:text-route66-red transition-colors"
          >
            <Target className="h-4 w-4" />
            <span className="font-sans font-medium tracking-wide">Goals</span>
          </Link>
          <Link 
            to="/progress" 
            className="flex items-center gap-2 text-route66-brown hover:text-route66-red transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="font-sans font-medium tracking-wide">Progress</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="font-sans font-medium text-route66-brown hidden md:inline tracking-wide">
                {user.email}
              </span>
              <Button variant="desert" size="sm" onClick={() => signOut()}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="route66" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="desert" size="sm">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};