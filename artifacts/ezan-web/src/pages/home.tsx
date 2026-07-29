import { useState } from 'react';
import { motion } from 'framer-motion';
import { usePrayerTimes } from '@/hooks/use-prayer-times';
import { useNotifications } from '@/hooks/use-notifications';
import { useUserName } from '@/hooks/use-user-name';
import { PrayerCard } from '@/components/prayer-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, MapPin } from 'lucide-react';

export default function Home() {
  const { userName, saveUserName, loading: userLoading } = useUserName();
  const { prayerTimes, nextPrayer, timeUntilNext, locationName, loading: prayerLoading } = usePrayerTimes();
  const [nameInput, setNameInput] = useState('');

  useNotifications(prayerTimes);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) saveUserName(nameInput.trim());
  };

  if (userLoading) {
    return (
      <div className="min-h-[calc(100dvh-5rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // --- First visit onboarding ---
  if (!userName) {
    return (
      <div className="min-h-[calc(100dvh-5rem)] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-accent mb-6 shadow-xl">
              <img
                src="/ezan-web/logo.jpg"
                alt="Ezan Vakti"
                className="w-20 h-20 rounded-2xl object-cover"
              />
            </div>
            <h1 className="text-4xl font-extrabold text-foreground mb-3">Hoş Geldiniz</h1>
            <p className="text-lg text-muted-foreground">
              Size nasıl hitap etmemizi istersiniz?
            </p>
          </div>

          <form onSubmit={handleNameSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="İsminizi girin"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="h-14 text-lg px-6 bg-card border-2 border-border focus:border-primary rounded-xl"
              autoFocus
              data-testid="input-name"
            />
            <Button
              type="submit"
              size="lg"
              className="w-full h-14 text-lg font-semibold rounded-xl"
              disabled={!nameInput.trim()}
              data-testid="button-submit-name"
            >
              Devam Et
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  const todayStr = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-1"
      >
        <h2
          className="text-3xl sm:text-4xl font-extrabold text-foreground"
          data-testid="text-greeting"
        >
          Bugün Nasılsınız, {userName}?
        </h2>
        <p className="text-lg text-muted-foreground" data-testid="text-date">
          {todayStr}
        </p>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground" data-testid="text-location">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{locationName}</span>
        </div>
      </motion.div>

      {/* Next prayer hero card */}
      {prayerLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : nextPrayer ? (
        <div className="max-w-2xl">
          <PrayerCard prayer={nextPrayer} showCountdown countdown={timeUntilNext} />
        </div>
      ) : null}

      {/* Full prayer list */}
      {!prayerLoading && prayerTimes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Bugünün Namaz Vakitleri
          </h3>
          <div className="grid gap-3">
            {prayerTimes.map((prayer) =>
              !prayer.isNext ? (
                <PrayerCard key={prayer.name} prayer={prayer} />
              ) : null,
            )}
          </div>
        </div>
      )}
    </div>
  );
}
