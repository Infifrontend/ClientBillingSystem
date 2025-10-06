
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, X } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface UrgentCase {
  id: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  message: string;
  clientId: string;
  clientName: string;
  relatedEntityId: string;
}

export function UrgentCasesBanner() {
  const [dismissed, setDismissed] = useState<string[]>([]);

  const { data: urgentCases = [] } = useQuery<UrgentCase[]>({
    queryKey: ["/api/notifications/urgent"],
    refetchInterval: 60000, // Refresh every minute
  });

  const visibleCases = urgentCases.filter(c => !dismissed.includes(c.id));
  const criticalCases = visibleCases.filter(c => c.severity === "critical" || c.severity === "high");

  if (criticalCases.length === 0) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-2 mb-6">
      {criticalCases.slice(0, 3).map((urgentCase) => (
        <Alert
          key={urgentCase.id}
          variant={urgentCase.severity === "critical" ? "destructive" : "default"}
          className="relative"
        >
          <AlertCircle className="h-4 w-4" />
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <AlertTitle className="mb-0">{urgentCase.title}</AlertTitle>
                <Badge variant={getSeverityColor(urgentCase.severity)} className="text-xs">
                  {urgentCase.severity}
                </Badge>
              </div>
              <AlertDescription>{urgentCase.message}</AlertDescription>
              <Link href={`/clients/${urgentCase.clientId}`}>
                <Button variant="link" size="sm" className="h-auto p-0 mt-2">
                  View Client Details →
                </Button>
              </Link>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setDismissed([...dismissed, urgentCase.id])}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  );
}
