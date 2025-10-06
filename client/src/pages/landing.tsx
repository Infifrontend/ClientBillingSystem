
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Briefcase, Users, FileText, TrendingUp, Shield, Zap, ArrowRight, Sparkles } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-chart-2/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Hero Section */}
        <div className="text-center space-y-8 mb-24 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Enterprise-Grade Solution</span>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-primary/20 blur-3xl animate-pulse"></div>
            </div>
            <div className="relative w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform duration-300">
              <Briefcase className="h-12 w-12 text-white" />
            </div>
          </div>

          <div className="space-y-6">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold font-display bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent leading-tight">
              Infiniti Client Management
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Transform your airline and travel technology operations with our intelligent client management and billing ecosystem
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <Button
              size="lg"
              className="px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-login"
            >
              Sign In to Dashboard
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 text-lg font-semibold rounded-xl border-2 hover:bg-primary/5"
            >
              Watch Demo
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto pt-12">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold font-display text-primary">500+</div>
              <div className="text-sm text-muted-foreground mt-1">Active Clients</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold font-display text-accent">$10M+</div>
              <div className="text-sm text-muted-foreground mt-1">Revenue Managed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold font-display text-chart-3">99.9%</div>
              <div className="text-sm text-muted-foreground mt-1">Uptime SLA</div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-muted-foreground">
              Powerful features designed for modern aviation businesses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="group p-8 bg-card/50 backdrop-blur-sm border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Client Management</h3>
              <p className="text-muted-foreground leading-relaxed">
                Comprehensive client profiles with intelligent contact management and global region support
              </p>
            </Card>

            <Card className="group p-8 bg-card/50 backdrop-blur-sm border-2 hover:border-chart-2/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-chart-2 to-chart-2/60 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Smart Agreements</h3>
              <p className="text-muted-foreground leading-relaxed">
                Automated lifecycle tracking with AI-powered renewal alerts and expiry notifications
              </p>
            </Card>

            <Card className="group p-8 bg-card/50 backdrop-blur-sm border-2 hover:border-chart-3/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-chart-3 to-chart-3/60 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">AI Insights</h3>
              <p className="text-muted-foreground leading-relaxed">
                Predictive revenue forecasting, client health scoring, and intelligent risk assessment
              </p>
            </Card>

            <Card className="group p-8 bg-card/50 backdrop-blur-sm border-2 hover:border-chart-4/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-chart-4 to-chart-4/60 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Multi-Currency</h3>
              <p className="text-muted-foreground leading-relaxed">
                Seamless INR, USD, and EUR billing with real-time exchange rate synchronization
              </p>
            </Card>

            <Card className="group p-8 bg-card/50 backdrop-blur-sm border-2 hover:border-chart-5/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-chart-5 to-chart-5/60 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Enterprise Security</h3>
              <p className="text-muted-foreground leading-relaxed">
                Role-based access control for Admin, Finance, CSM, and Manager with audit trails
              </p>
            </Card>

            <Card className="group p-8 bg-card/50 backdrop-blur-sm border-2 hover:border-destructive/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-destructive to-destructive/60 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Advanced Analytics</h3>
              <p className="text-muted-foreground leading-relaxed">
                Comprehensive reports with Excel, PDF, and CSV export capabilities for deep insights
              </p>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto text-center py-16">
          <div className="relative p-12 rounded-3xl bg-gradient-to-br from-primary/10 via-accent/10 to-chart-2/10 backdrop-blur-sm border-2 border-primary/20">
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join hundreds of aviation companies already using Infiniti
            </p>
            <Button
              size="lg"
              className="px-10 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => window.location.href = "/api/login"}
            >
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            Infiniti Software Solutions © 2025 | Enterprise Client Management & Billing System
          </p>
        </div>
      </div>
    </div>
  );
}
