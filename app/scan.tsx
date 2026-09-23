import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Loader } from '@/components/Loader';
import { colors } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { checkinCode, type CheckinResponse } from '@/lib/checkin';

const RESULT_COLOR: Record<CheckinResponse['result'], string> = {
  ok: colors.success,
  already_used: colors.warning,
  wrong_event: '#ff8a3d',
  invalid: colors.danger,
};

const RESULT_TITLE: Record<CheckinResponse['result'], string> = {
  ok: 'Liberado',
  already_used: 'Já utilizado',
  wrong_event: 'Evento errado',
  invalid: 'Inválido',
};

export default function ScanScreen() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState('');
  const [locked, setLocked] = useState(false);
  const [outcome, setOutcome] = useState<CheckinResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, router, user]);

  const run = useCallback(async (code: string) => {
    const payload = code.trim();
    if (!payload || busy || locked) return;
    setBusy(true);
    setError(null);
    try {
      const next = await checkinCode(payload);
      setOutcome(next);
      setLocked(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Falha ao validar.');
    } finally {
      setBusy(false);
    }
  }, [busy, locked]);

  function reset() {
    setOutcome(null);
    setLocked(false);
    setManual('');
    setError(null);
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <Loader screen />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.title}>Câmera</Text>
        <Text style={styles.lead}>Precisamos da câmera para ler o QR na porta.</Text>
        <Pressable onPress={() => void requestPermission()} style={styles.button}>
          <Text style={styles.buttonText}>Liberar câmera</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const tone = outcome ? RESULT_COLOR[outcome.result] : colors.blue;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.head}>
        <View>
          <Text style={styles.kicker}>GATE8 PORTARIA</Text>
          <Text style={styles.user}>{user?.name || user?.email || 'Equipe'}</Text>
        </View>
        <Pressable onPress={() => void signOut()} hitSlop={10}>
          <Text style={styles.out}>Sair</Text>
        </Pressable>
      </View>

      <View style={styles.cameraWrap}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={locked || busy ? undefined : ({ data }) => void run(data)}
        />
        <View style={styles.frame} pointerEvents="none" />
        {busy ? (
          <View style={styles.overlay}>
            <Loader />
          </View>
        ) : null}
        {outcome ? (
          <View style={[styles.overlay, { backgroundColor: `${tone}EE` }]}>
            <Ionicons
              name={outcome.result === 'ok' ? 'checkmark-circle' : 'close-circle'}
              size={72}
              color="#050d1f"
            />
            <Text style={styles.resultTitle}>{RESULT_TITLE[outcome.result]}</Text>
            {outcome.ticket?.holder_name ? (
              <Text style={styles.resultName}>{outcome.ticket.holder_name}</Text>
            ) : null}
            {outcome.ticket?.batch_name ? (
              <Text style={styles.resultMeta}>{outcome.ticket.batch_name}</Text>
            ) : null}
            <Pressable onPress={reset} style={styles.next}>
              <Text style={styles.nextText}>Próximo</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.manual}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={styles.manualLabel}>Código manual</Text>
        <View style={styles.row}>
          <TextInput
            value={manual}
            onChangeText={setManual}
            placeholder="Digite o código"
            placeholderTextColor="rgba(255,255,255,0.28)"
            autoCapitalize="none"
            style={styles.input}
            editable={!locked}
            onSubmitEditing={() => void run(manual)}
          />
          <Pressable onPress={() => void run(manual)} disabled={busy || locked} style={styles.go}>
            {busy ? <Loader size={18} color={colors.loginText} /> : <Ionicons name="send" size={18} color={colors.loginText} />}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  head: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kicker: {
    color: colors.blue,
    fontWeight: '800',
    letterSpacing: 1.2,
    fontSize: 12,
  },
  user: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  out: {
    color: colors.muted,
    fontSize: 14,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginTop: 24,
  },
  lead: {
    color: colors.muted,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  cameraWrap: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  frame: {
    ...StyleSheet.absoluteFillObject,
    margin: 42,
    borderWidth: 2,
    borderColor: 'rgba(0,123,255,0.85)',
    borderRadius: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5,13,31,0.72)',
    gap: 8,
    padding: 24,
  },
  resultTitle: {
    color: '#050d1f',
    fontSize: 28,
    fontWeight: '800',
  },
  resultName: {
    color: '#050d1f',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  resultMeta: {
    color: '#050d1f',
    opacity: 0.8,
  },
  next: {
    marginTop: 16,
    backgroundColor: '#050d1f',
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  nextText: {
    color: colors.text,
    fontWeight: '700',
  },
  manual: {
    padding: 16,
    paddingBottom: 24,
  },
  manualLabel: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    color: colors.text,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  go: {
    width: 48,
    borderRadius: 12,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    marginHorizontal: 16,
    backgroundColor: colors.blue,
    borderRadius: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.loginText,
    fontWeight: '700',
  },
  error: {
    color: colors.danger,
    marginBottom: 8,
  },
});
