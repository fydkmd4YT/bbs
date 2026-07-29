import { motion } from 'framer-motion';
import { PrayerTimeData } from '@/hooks/use-prayer-times';
import { Clock } from 'lucide-react';

interface PrayerCardProps {
  prayer: PrayerTimeData;
  showCountdown?: boolean;
  countdown?: string;
}

export function PrayerCard({ prayer, showCountdown, countdown }: PrayerCardProps) {
  const timeString = prayer.time.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (prayer.isNext) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-card to-card border-2 border-primary/30 p-8 animate-sacred-glow"
        data-testid={`prayer-card-${prayer.name}-next`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-accent/20">
              <Clock className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Sıradaki Namaz
              </p>
              <h2 className="text-4xl font-bold text-foreground" data-testid={`text-prayer-name-${prayer.name}`}>
                {prayer.turkishName}
              </h2>
            </div>
          </div>
          
          <div className="flex items-baseline gap-4 mt-6">
            <span className="text-6xl font-bold text-accent" data-testid={`text-prayer-time-${prayer.name}`}>
              {timeString}
            </span>
          </div>

          {showCountdown && countdown && (
            <div className="mt-6 pt-6 border-t border-border/50">
              <p className="text-sm text-muted-foreground mb-2">Kalan Süre</p>
              <p className="text-2xl font-semibold text-foreground" data-testid="text-countdown">
                {countdown}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className={`rounded-xl border p-6 transition-all ${
        prayer.isPassed
          ? 'bg-muted/30 border-border/50 opacity-50'
          : 'bg-card border-card-border hover:border-primary/30'
      }`}
      data-testid={`prayer-card-${prayer.name}${prayer.isPassed ? '-passed' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-1" data-testid={`text-prayer-name-${prayer.name}`}>
            {prayer.turkishName}
          </h3>
          <p className="text-sm text-muted-foreground">
            {prayer.isPassed ? 'Geçti' : 'Yaklaşıyor'}
          </p>
        </div>
        <span className="text-3xl font-bold text-foreground" data-testid={`text-prayer-time-${prayer.name}`}>
          {timeString}
        </span>
      </div>
    </motion.div>
  );
}
