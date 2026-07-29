import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getReminderSettings, saveReminderSettings, ReminderSettings } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PRAYER_NAMES: Record<string, string> = {
  fajr: 'Sabah',
  dhuhr: 'Öğle',
  asr: 'İkindi',
  maghrib: 'Akşam',
  isha: 'Yatsı',
};

const REMINDER_OPTIONS = [
  { value: '0', label: 'Kapalı' },
  { value: '5', label: '5 dakika önce' },
  { value: '10', label: '10 dakika önce' },
  { value: '15', label: '15 dakika önce' },
  { value: '20', label: '20 dakika önce' },
  { value: '30', label: '30 dakika önce' },
];

export default function Settings() {
  const [settings, setSettings] = useState<ReminderSettings>(getReminderSettings());
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const { toast } = useToast();

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const handleReminderChange = (prayer: string, value: string) => {
    const newSettings = {
      ...settings,
      [prayer]: parseInt(value, 10),
    };
    setSettings(newSettings);
    saveReminderSettings(newSettings);
    
    toast({
      title: 'Ayar kaydedildi',
      description: `${PRAYER_NAMES[prayer]} hatırlatıcısı güncellendi`,
    });
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      
      if (permission === 'granted') {
        toast({
          title: 'Bildirimler açıldı',
          description: 'Artık namaz vakti hatırlatıcıları alacaksınız',
        });
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">Ayarlar</h1>
        <p className="text-muted-foreground">
          Hatırlatıcılarınızı ve uygulama tercihlerinizi yönetin
        </p>
      </motion.div>

      {/* Notification Permission */}
      {permissionStatus !== 'granted' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-xl border-2 border-accent/30 bg-accent/5 p-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-accent/20">
              <Info className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">
                Bildirimlere İzin Verin
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Namaz vakti hatırlatıcıları alabilmek için tarayıcı bildirimlerine izin vermeniz gerekiyor.
              </p>
              <Button 
                onClick={requestNotificationPermission}
                variant="default"
                data-testid="button-enable-notifications"
              >
                <Bell className="w-4 h-4 mr-2" />
                Bildirimleri Aç
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Reminder Settings */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="rounded-xl border border-card-border bg-card p-6"
      >
        <h2 className="text-xl font-semibold text-foreground mb-6">
          Hatırlatıcı Süresi
        </h2>
        
        <div className="space-y-4">
          {Object.entries(PRAYER_NAMES).map(([key, name]) => (
            <div key={key} className="flex items-center justify-between gap-4 py-3">
              <label className="text-base font-medium text-foreground" htmlFor={`reminder-${key}`}>
                {name}
              </label>
              <Select
                value={settings[key]?.toString() || '0'}
                onValueChange={(value) => handleReminderChange(key, value)}
              >
                <SelectTrigger 
                  className="w-48" 
                  id={`reminder-${key}`}
                  data-testid={`select-reminder-${key}`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_OPTIONS.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      data-testid={`option-${key}-${option.value}`}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </motion.div>

      {/* About Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="rounded-xl border border-card-border bg-card p-6"
      >
        <h2 className="text-xl font-semibold text-foreground mb-6">
          Hakkında
        </h2>
        
        <div className="flex items-center gap-6">
          <div className="flex-shrink-0">
            <img 
              src="/ezan-web/logo.jpg" 
              alt="Ezan Vakti Logo" 
              className="w-24 h-24 rounded-2xl object-cover shadow-lg"
            />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-foreground">
              Ezan Vakti
            </h3>
            <p className="text-base text-muted-foreground">
              Yapımcı: <span className="font-semibold text-foreground">Bombom Team</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Namaz vakitlerini takip edin, hatırlatıcılar alın
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
