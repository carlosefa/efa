import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Download,
  Smartphone,
  Monitor,
  CheckCircle2,
  Apple,
  Chrome,
} from "lucide-react";
import { Link } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <img
            src="/efa-logo.png"
            alt="EFA Esports"
            className="w-20 h-20 mx-auto mb-4"
          />
          <CardTitle className="text-2xl">Install EFA Esports</CardTitle>
          <CardDescription>
            Get quick access to the platform directly from your home screen
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
              <p className="text-lg font-medium">App installed successfully!</p>
              <p className="text-muted-foreground">
                You can now access EFA Esports directly from your home screen.
              </p>
              <Button asChild className="w-full">
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Benefits */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Smartphone className="w-5 h-5 text-primary" />
                  <span className="text-sm">
                    Quick access from your home screen
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Monitor className="w-5 h-5 text-primary" />
                  <span className="text-sm">Works offline</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Download className="w-5 h-5 text-primary" />
                  <span className="text-sm">Super fast loading</span>
                </div>
              </div>

              {/* Install Instructions */}
              {deferredPrompt ? (
                <Button onClick={handleInstall} className="w-full" size="lg">
                  <Download className="w-5 h-5 mr-2" />
                  Install App
                </Button>
              ) : isIOS ? (
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Apple className="w-5 h-5" />
                    Instructions for iPhone/iPad:
                  </div>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>
                      Tap the <strong>Share</strong> button (square with arrow
                      icon)
                    </li>
                    <li>
                      Scroll and tap <strong>"Add to Home Screen"</strong>
                    </li>
                    <li>
                      Tap <strong>"Add"</strong> in the top-right corner
                    </li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Chrome className="w-5 h-5" />
                    Instructions for Android/Desktop:
                  </div>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>Open the browser menu (three dots)</li>
                    <li>
                      Select <strong>"Install app"</strong> or{" "}
                      <strong>"Add to home screen"</strong>
                    </li>
                    <li>Confirm the installation</li>
                  </ol>
                </div>
              )}

              <Button variant="outline" asChild className="w-full">
                <Link to="/">Back to website</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

