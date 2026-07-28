import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';

export const USER_NAME_KEY = '@user_name';

interface Props {
  onComplete: (name: string) => void;
}

export function OnboardingScreen({ onComplete }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleContinue = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await AsyncStorage.setItem(USER_NAME_KEY, trimmed);

      if (Platform.OS !== 'web') {
        await Notifications.requestPermissionsAsync();
      }
    } catch {}

    setLoading(false);
    onComplete(trimmed);
  };

  const gradientColors: [string, string, string] =
    colors.background === '#0D0520'
      ? ['#2A0855', '#0D0520', '#110A28']
      : ['#EDE5FF', '#FAF5FF', '#F0E8FF'];

  return (
    <LinearGradient colors={gradientColors} style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View
          style={[
            styles.container,
            { paddingTop: topPad + 32, paddingBottom: bottomPad + 24 },
          ]}
        >
          {/* Logo */}
          <View style={styles.logoSection}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={[styles.logo, { borderRadius: colors.radius + 4 }]}
              resizeMode="cover"
            />
          </View>

          {/* Welcome text */}
          <View style={styles.textSection}>
            <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>
              Ezan Vakti&apos;ne{'\n'}Hos Geldiniz
            </Text>
            <Text style={[styles.welcomeSub, { color: colors.mutedForeground }]}>
              Bombom Team
            </Text>
          </View>

          {/* Input section */}
          <View style={styles.inputSection}>
            <Text style={[styles.question, { color: colors.foreground }]}>
              Size nasil hitap etmemizi istersiniz?
            </Text>

            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.card,
                  borderColor: name.trim() ? colors.primary : colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={name.trim() ? colors.primary : colors.mutedForeground}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}
                placeholder="Isminizi giriniz"
                placeholderTextColor={colors.mutedForeground}
                value={name}
                onChangeText={setName}
                autoCorrect={false}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleContinue}
                maxLength={40}
              />
            </View>

            <TouchableOpacity
              onPress={handleContinue}
              activeOpacity={0.8}
              disabled={!name.trim() || loading}
              style={[styles.btnWrap, { opacity: name.trim() && !loading ? 1 : 0.45 }]}
            >
              <LinearGradient
                colors={['#7B2FBE', '#F5A623']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.btn, { borderRadius: colors.radius }]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Text style={styles.btnText}>Devam Et</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              Bildirim izni icin onayiniz istenecektir
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 110,
    height: 110,
    shadowColor: '#7B2FBE',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  textSection: {
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 34,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 8,
  },
  welcomeSub: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  inputSection: {
    gap: 16,
  },
  question: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 4,
    height: 56,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 17,
    height: '100%',
  },
  btnWrap: {},
  btn: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  btnText: {
    color: '#FFF',
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  hint: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});
