import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Lock, Mail, User } from "lucide-react";

interface AuthPlaceholderProps {
  onAuthSuccess?: () => void;
}

export const AuthPlaceholder = ({ onAuthSuccess }: AuthPlaceholderProps) => {
  const handleAuth = (type: 'signin' | 'signup') => {
    console.log(`${type} attempted`);
    // Here you would integrate with Supabase auth
    onAuthSuccess?.();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Car className="h-16 w-16 text-route66-red text-vintage animate-pulse" />
          </div>
          <h1 className="font-highway text-2xl text-sunset mb-2">
            Route 66 Calendar
          </h1>
          <p className="font-americana text-route66-brown text-vintage">
            Join the journey
          </p>
        </div>

        <Card className="vintage-card">
          <CardContent className="p-6">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin" className="font-americana">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="font-americana">
                  Sign Up
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="signin-email" className="font-americana text-route66-brown">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-route66-red" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        className="highway-input font-americana pl-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="signin-password" className="font-americana text-route66-brown">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-route66-red" />
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="Enter your password"
                        className="highway-input font-americana pl-10"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => handleAuth('signin')}
                    variant="route66" 
                    className="w-full"
                  >
                    Start Journey
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="signup-name" className="font-americana text-route66-brown">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-route66-red" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Your full name"
                        className="highway-input font-americana pl-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="signup-email" className="font-americana text-route66-brown">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-route66-red" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        className="highway-input font-americana pl-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="signup-password" className="font-americana text-route66-brown">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-route66-red" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password"
                        className="highway-input font-americana pl-10"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => handleAuth('signup')}
                    variant="desert" 
                    className="w-full"
                  >
                    Begin Journey
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 text-center">
              <p className="font-americana text-xs text-muted-foreground">
                Note: Authentication will be integrated with Supabase
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};