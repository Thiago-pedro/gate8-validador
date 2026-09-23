import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthScreenShell, useAuthKeyboard } from '@/components/AuthScreenShell';
import { Spinner } from '@/components/Spinner';
import { Logo } from '@/components/Logo';
import { NeonCard } from '@/components/NeonCard';
import { colors } from '@/constants/theme';
import { useEventSession } from '@/lib/event-context';

function TokenForm() {
  const { enter } = useEventSession();
  const { keyboardOpen } = useAuthKeyboard();
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!token.trim()) {
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

  return (
    <>
      <View style={[styles.logoWrap, keyboardOpen && styles.logoWrapCompact]}>
        <Logo height={keyboardOpen ? 40 : 56} centered />
        <Text style={styles.brand}>PORTARIA</Text>
      </View>
      <NeonCard>
        <Text style={styles.title}>Entrar</Text>
        <Text style={styles.lead}>
          Cole o token da portaria gerado no painel do produtor.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={styles.label}>TOKEN</Text>
        <TextInput
          value={token}
          onChangeText={(value) => setToken(value.replace(/\D/g, ''))}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={12}
          autoCorrect={false}
          autoComplete="off"
          placeholder="Token do evento"
          placeholderTextColor="rgba(255,255,255,0.28)"
          style={styles.input}
          onSubmitEditing={() => void submit()}
        />
        <Pressable onPress={() => void submit()} disabled={busy} style={styles.button}>
          {busy ? <Spinner size={20} color={colors.loginText} /> : <Text style={styles.buttonText}>Entrar</Text>}
        </Pressable>
      </NeonCard>
    </>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { event, loading } = useEventSession();

  useEffect(() => {
    if (!loading && event) router.replace('/scan');
  }, [event, loading, router]);

  return (
    <AuthScreenShell>
      <TokenForm />
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  logoWrap: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoWrapCompact: {
    marginBottom: 16,
  },
  brand: {
    color: colors.blue,
    fontWeight: '800',
    letterSpacing: 4,
    marginTop: 10,
    fontSize: 13,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  lead: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 6,
    marginBottom: 18,
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
    marginBottom: 6,
  },
  input: {
    color: colors.text,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
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
