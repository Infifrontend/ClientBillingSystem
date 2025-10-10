import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { EmailSendDialog } from "@/components/email-send-dialog";

export default function EmailPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button onClick={() => setIsDialogOpen(true)}>
          <Mail className="h-4 w-4 mr-2" />
          Compose Email
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex-col items-start"
              onClick={() => setIsDialogOpen(true)}
            >
              <Mail className="h-5 w-5 mb-2" />
              <div className="text-left">
                <p className="font-semibold">Send Email</p>
                <p className="text-xs text-muted-foreground">
                  Compose and send a new email
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex-col items-start"
              onClick={() => setIsDialogOpen(true)}
            >
              <Mail className="h-5 w-5 mb-2" />
              <div className="text-left">
                <p className="font-semibold">Email Client</p>
                <p className="text-xs text-muted-foreground">
                  Send email to a specific client
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex-col items-start"
              onClick={() => setIsDialogOpen(true)}
            >
              <Mail className="h-5 w-5 mb-2" />
              <div className="text-left">
                <p className="font-semibold">Bulk Email</p>
                <p className="text-xs text-muted-foreground">
                  Send email to multiple recipients
                </p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      <EmailSendDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}
