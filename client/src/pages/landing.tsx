import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Users, FileText, TrendingUp, Shield, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6 mb-16">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <Briefcase className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold font-display text-foreground">
            Infiniti Client Management
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Enterprise-grade client management and billing system for airline and travel technology solutions
          </p>
          <div className="pt-4">
            <Button
              size="lg"
              className="px-8"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-login"
            >
              Sign In to Dashboard
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Client Management</CardTitle>
              <CardDescription>
                Comprehensive client profiles with contacts, services, and global region support
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-chart-2/10 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-chart-2" />
              </div>
              <CardTitle>Agreement Tracking</CardTitle>
              <CardDescription>
                Lifecycle management with automated renewal alerts and expiry notifications
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-chart-3/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-chart-3" />
              </div>
              <CardTitle>AI Insights</CardTitle>
              <CardDescription>
                Revenue forecasting, client health scoring, and risk assessment analytics
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-chart-4/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-chart-4" />
              </div>
              <CardTitle>Multi-Currency Billing</CardTitle>
              <CardDescription>
                Support for INR, USD, and EUR with real-time exchange rate sync
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-chart-5/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-chart-5" />
              </div>
              <CardTitle>Role-Based Access</CardTitle>
              <CardDescription>
                Secure permissions for Admin, Finance, CSM, and Manager roles
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Advanced Reports</CardTitle>
              <CardDescription>
                Outstanding invoices and revenue analytics with Excel, PDF, CSV export
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center mt-16 text-sm text-muted-foreground">
          <p>Infiniti Software Solutions © 2025 | Enterprise Client Management & Billing System</p>
        </div>
      </div>
    </div>
  );
}
