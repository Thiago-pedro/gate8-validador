import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthScreenShell } from '@/components/AuthScreenShell';
import { Spinner } from '@/components/Spinner';
import { NeonCard } from '@/components/NeonCard';
import { SiteFooter } from '@/components/SiteFooter';
import { colors } from '@/constants/theme';
import { useEventSession } from '@/lib/event-context';

const LOGIN_LOGO = require('../assets/images/logo-gate8-login.png');
const LOGIN_LOGO_ASPECT = 1024 / 205;
const PORTARIA_BLUE = '#0000fe';
const GATE_SILVER = '#B3B1B2';
const TOKEN_LENGTH = 6;

function TokenForm() {
  const { enter } = useEventSession();
  const inputRef = useRef<TextInput>(null);
  const [token, setToken] = useState('');
  const [focused, setFocused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onTokenChange(value: string) {
    setToken(value.replace(/\D/g, '').slice(0, TOKEN_LENGTH));
    if (error) setError(null);
  }

  async function submit() {
    if (token.length !== TOKEN_LENGTH) {
      setError('Token inválido');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      Keyboard.dismiss();
      await enter(token);
    } catch (caught) {
      setError('Token inválido');
    } finally {
      setBusy(false);
    }
  }

  const activeIndex = Math.min(token.length, TOKEN_LENGTH - 1);

  return (
    <View>
      <View style={styles.logoWrap}>
        <Image
          accessibilityLabel="Gate8"
          source={LOGIN_LOGO}
          style={styles.logo}
          resizeMode="contain"
          fadeDuration={0}
        />
        <Text style={styles.brand}>VALIDADOR</Text>
      </View>
      <NeonCard accent={PORTARIA_BLUE}>
        <Text style={styles.title}>Entrar</Text>
        <Text style={styles.lead}>Digite o token do evento.</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={styles.label}>TOKEN</Text>
        <Pressable style={styles.otpWrap} onPress={() => inputRef.current?.focus()}>
          <View style={styles.otpRow} pointerEvents="none">
            {Array.from({ length: TOKEN_LENGTH }, (_, index) => {
              const digit = token[index];
              const active = focused && index === activeIndex;
              return (
                <View key={index} style={[styles.cell, active && styles.cellActive]}>
                  <Text style={styles.cellText}>{digit ?? ''}</Text>
                </View>
              );
            })}
          </View>
          <TextInput
            ref={inputRef}
            value={token}
            onChangeText={onTokenChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={TOKEN_LENGTH}
            autoCorrect={false}
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            caretHidden
            selectionColor="transparent"
            style={styles.otpHidden}
            onSubmitEditing={() => void submit()}
          />
        </Pressable>
        <Pressable onPress={() => void submit()} disabled={busy} style={styles.button}>
          {busy ? <Spinner size={20} color={colors.loginText} /> : <Text style={styles.buttonText}>Entrar</Text>}
        </Pressable>
      </NeonCard>
    </View>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { event, loading } = useEventSession();

  useEffect(() => {
    if (!loading && event) router.replace('/scan');
  }, [event, loading, router]);

  return (
    <AuthScreenShell footer={<SiteFooter />}>
      <TokenForm />
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  logoWrap: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    height: 56,
    width: 56 * LOGIN_LOGO_ASPECT,
  },
  brand: {
    color: GATE_SILVER,
    fontWeight: '800',
    letterSpacing: 4,
    marginTop: 2,
    fontSize: 13,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  lead: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 6,
    marginBottom: 18,
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
    marginBottom: 12,
    textAlign: 'center',
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 10,
    textAlign: 'center',
  },
  otpWrap: {
    position: 'relative',
    marginBottom: 16,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  otpHidden: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.02,
    color: 'transparent',
  },
  cell: {
    width: 44,
    height: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: PORTARIA_BLUE,
    backgroundColor: 'rgba(0, 0, 254, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellActive: {
    borderWidth: 2,
    backgroundColor: 'rgba(0, 0, 254, 0.16)',
  },
  cellText: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
  },
  button: {
    backgroundColor: colors.blue,
    borderRadius: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: colors.loginText,
    fontWeight: '700',
    fontSize: 16,
  },
});
