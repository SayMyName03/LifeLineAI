import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Clock, Shield, Users, ArrowRight, Activity, Plus, Zap, Stethoscope } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage = ({ onGetStarted }: LandingPageProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 relative overflow-hidden">
      {/* Enhanced Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating medical icons */}
        <div className="absolute top-20 left-10 text-medical-200 dark:text-medical-800 animate-float">
          <Heart className="w-8 h-8" />
        </div>
        <div className="absolute top-40 right-20 text-emergency-200 dark:text-emergency-800 animate-float" style={{ animationDelay: '2s' }}>
          <Plus className="w-6 h-6" />
        </div>
        <div className="absolute bottom-40 left-20 text-medical-300 dark:text-medical-700 animate-drift">
          <Stethoscope className="w-10 h-10" />
        </div>
        <div className="absolute top-60 left-1/3 text-blue-200 dark:text-blue-800 animate-float" style={{ animationDelay: '1s' }}>
          <Zap className="w-7 h-7" />
        </div>
        
        {/* Animated background circles */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-medical-200 dark:bg-medical-800 rounded-full opacity-20 animate-pulse-soft"></div>
        <div className="absolute top-1/2 -right-10 w-32 h-32 bg-emergency-200 dark:bg-emergency-800 rounded-full opacity-20 animate-pulse-soft" style={{ animationDelay: '1s' }}></div>
        {/* Removed bottom left animated circle to prevent footer overlap */}
        <div className="absolute top-1/4 right-1/4 w-36 h-36 bg-blue-200 dark:bg-blue-800 rounded-full opacity-10 animate-drift"></div>
        
        {/* Gradient overlays */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-medical-100/30 to-transparent dark:from-medical-900/30 rounded-full blur-3xl animate-pulse-soft"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-emergency-100/30 to-transparent dark:from-emergency-900/30 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-4 right-4 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-2 shadow-lg">
        <ThemeToggle />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="container mx-auto text-center">
          {/* Hero Content */}
          <div className="relative z-10">
            <div className="inline-flex items-center px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full border border-medical-200 dark:border-medical-700 mb-6 animate-fade-in">
              <Activity className="w-4 h-4 text-emergency-500 mr-2" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI-Powered Emergency Triage</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-medical-800 dark:text-medical-100 mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Lifeline <span className="text-emergency-500">AI</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
              Revolutionary emergency medical triage system that helps healthcare professionals 
              make faster, more accurate decisions when every second counts.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <Button 
                onClick={onGetStarted} // This will now redirect to login
                size="lg" 
                className="bg-emergency-500 hover:bg-emergency-600 text-white px-8 py-4 text-lg group shadow-lg hover:shadow-xl transition-all"
              >
                Start Triage Assessment
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-2 border-medical-300 dark:border-medical-600 text-medical-700 dark:text-medical-300 hover:bg-medical-50 dark:hover:bg-medical-900 px-8 py-4 text-lg"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-medical-800 dark:text-medical-100 mb-4">
              Why Choose Lifeline AI?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Where Urgency Meets Intelligence.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Clock,
                title: "Rapid Assessment",
                description: "Complete triage evaluation in under 2 minutes",
                color: "text-emergency-500",
                bgColor: "bg-emergency-50 dark:bg-emergency-900/20",
                delay: "0s"
              },
              {
                icon: Heart,
                title: "Accurate Diagnosis",
                description: "AI-powered analysis of vital signs and symptoms",
                color: "text-medical-500",
                bgColor: "bg-medical-50 dark:bg-medical-900/20",
                delay: "0.1s"
              },
              {
                icon: Shield,
                title: "HIPAA Compliant",
                description: "Enterprise-grade security for patient data",
                color: "text-green-500",
                bgColor: "bg-green-50 dark:bg-green-900/20",
                delay: "0.2s"
              },
              {
                icon: Users,
                title: "Team Ready",
                description: "Multi-user support for emergency departments",
                color: "text-blue-500",
                bgColor: "bg-blue-50 dark:bg-blue-900/20",
                delay: "0.3s"
              }
            ].map((feature, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-fade-in border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
                style={{ animationDelay: feature.delay }}
              >
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 ${feature.bgColor} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-8 h-8 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl font-bold text-medical-800 dark:text-medical-100">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-medical-600 to-medical-800 dark:from-medical-800 dark:to-medical-900 text-white">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { number: "98%", label: "Accuracy Rate", delay: "0s" },
              { number: "2min", label: "Average Assessment Time", delay: "0.2s" },
              { number: "24/7", label: "Available Support", delay: "0.4s" }
            ].map((stat, index) => (
              <div key={index} className="animate-fade-in" style={{ animationDelay: stat.delay }}>
                <div className="text-5xl md:text-6xl font-bold mb-2 text-white">
                  {stat.number}
                </div>
                <div className="text-xl text-medical-100">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-medical-800 dark:text-medical-100 mb-6">
              Ready to Save Lives?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Join thousands of healthcare professionals using Lifeline AI to provide 
              faster, more accurate emergency care.
            </p>
            <Button 
              onClick={onGetStarted}
              size="lg" 
              className="bg-emergency-500 hover:bg-emergency-600 text-white px-12 py-6 text-xl group shadow-lg hover:shadow-xl transition-all"
            >
              Begin Assessment Now
              <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <Activity className="w-8 h-8 text-emergency-500 mr-3" />
            <span className="text-2xl font-bold">Lifeline AI</span>
          </div>
          <p className="text-gray-400 mb-4">
            Emergency Medical Triage System
          </p>
          <p className="text-sm text-gray-500">
            © 2024 Lifeline AI - For emergency medical use by qualified healthcare professionals
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
