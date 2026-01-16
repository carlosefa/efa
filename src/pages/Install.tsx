import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Monitor, CheckCircle2, Apple, Chrome } from "lucide-react";
import { Link } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
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

    deferredPrompt.prompt();
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
          <img src="/efa-logo.png" alt="EFA Esports" className="w-20 h-20 mx-auto mb-4" />
          <CardTitle className="text-2xl">Instalar EFA Esports</CardTitle>
          <CardDescription>
            Tenha acesso rápido à plataforma direto da sua tela inicial
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
              <p className="text-lg font-medium">App instalado com sucesso!</p>
              <p className="text-muted-foreground">
                Agora você pode acessar o EFA Esports direto da sua tela inicial.
              </p>
              <Button asChild className="w-full">
                <Link to="/dashboard">Ir para o Dashboard</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Benefits */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Smartphone className="w-5 h-5 text-primary" />
                  <span className="text-sm">Acesso rápido pela tela inicial</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Monitor className="w-5 h-5 text-primary" />
                  <span className="text-sm">Funciona offline</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Download className="w-5 h-5 text-primary" />
                  <span className="text-sm">Carregamento super rápido</span>
                </div>
              </div>

              {/* Install Instructions */}
              {deferredPrompt ? (
                <Button onClick={handleInstall} className="w-full" size="lg">
                  <Download className="w-5 h-5 mr-2" />
                  Instalar App
                </Button>
              ) : isIOS ? (
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Apple className="w-5 h-5" />
                    Instruções para iPhone/iPad:
                  </div>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>Toque no botão <strong>Compartilhar</strong> (ícone de quadrado com seta)</li>
                    <li>Role e toque em <strong>"Adicionar à Tela Inicial"</strong></li>
                    <li>Toque em <strong>"Adicionar"</strong> no canto superior direito</li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Chrome className="w-5 h-5" />
                    Instruções para Android/Desktop:
                  </div>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>Toque no menu do navegador (três pontos)</li>
                    <li>Selecione <strong>"Instalar app"</strong> ou <strong>"Adicionar à tela inicial"</strong></li>
                    <li>Confirme a instalação</li>
                  </ol>
                </div>
              )}

              <Button variant="outline" asChild className="w-full">
                <Link to="/">Voltar para o site</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
