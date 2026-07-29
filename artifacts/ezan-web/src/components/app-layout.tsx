import { Link, useLocation } from 'wouter';
import { Home, Settings } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Top navigation bar */}
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img 
                src="/ezan-web/logo.jpg" 
                alt="Ezan Vakti" 
                className="w-10 h-10 rounded-lg object-cover"
              />
              <h1 className="text-xl font-bold text-foreground">Ezan Vakti</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Link 
                href="/" 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  location === '/' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                data-testid="link-home"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Ana Sayfa</span>
              </Link>
              <Link 
                href="/settings" 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  location === '/settings' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                data-testid="link-settings"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Ayarlar</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
