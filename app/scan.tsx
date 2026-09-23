import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spinner } from '@/components/Spinner';
import { NeonCard } from '@/components/NeonCard';
import { Wordmark } from '@/components/Wordmark';
import { colors } from '@/constants/theme';
import { checkinCode, type CheckinKind, type CheckinResponse } from '@/lib/checkin';
import { useEventSession } from '@/lib/event-context';

const OVERLAY: Record<CheckinKind, string> = {
  valid: 'rgba(34, 197, 94, 0.80)',
  used: 'rgba(249, 115, 22, 0.80)',
  wrong_event: 'rgba(249, 115, 22, 0.80)',
  event_ended: 'rgba(249, 115, 22, 0.80)',
  invalid: 'rgba(239, 68, 68, 0.80)',
  error: 'rgba(239, 68, 68, 0.80)',
};

function Glass({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.glass, style]}>{children}</View>;
}

function GradientButton({
  label,
  icon,
  onPress,
  compact,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={['#007BFF', '#0056b3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientBtn, compact && styles.gradientBtnCompact]}
      >
        {icon ? <Ionicons name={icon} size={compact ? 14 : 16} color="#fff" /> : null}
        <Text style={[styles.gradientText, compact && styles.gradientTextCompact]}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export default function ScanScreen() {
  const router = useRouter();
  const { event, loading, leave } = useEventSession();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOn, setCameraOn] = useState(false);
  const [manual, setManual] = useState('');
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<CheckinResponse | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const lock = useRef(false);

  useEffect(() => {
    if (!loading && !event) router.replace('/login');
  }, [event, loading, router]);

  const run = useCallback(
    async (code: string) => {
      if (!event || !code.trim() || lock.current) return;
      lock.current = true;
      setBusy(true);
      try {
        const next = await checkinCode(event.id, code);
        setOutcome(next);
        setTimeout(() => setOutcome(null), 2000);
      } catch (caught) {
        setOutcome({
          kind: 'error',
          message: caught instanceof Error ? caught.message : 'Falha ao validar.',
        });
        setTimeout(() => setOutcome(null), 2000);
      } finally {
        setBusy(false);
        setTimeout(() => {
          lock.current = false;
        }, 1200);
      }
    },
    [event]
  );

  async function openCamera() {
    const current = permission?.granted ? permission : await requestPermission();
    if (!current.granted) {
    if (!current.granted) return;
    }
    setCameraOn(true);
  }

  async function leaveEvent() {
    setLeaveOpen(false);
    await leave();
    router.replace('/login');
  }

  if (loading || !event) {
    return (
      <View style={styles.boot}>
        <Spinner size={28} color={colors.blue} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.page}>
          <View style={styles.header}>
            <Wordmark height={28} />
            <Pressable
              onPress={() => setLeaveOpen(true)}
              hitSlop={12}
              style={styles.exitBtn}
              accessibilityRole="button"
              accessibilityLabel="Sair da portaria"
            >
              <Ionicons name="exit-outline" size={24} color="rgba(255,255,255,0.88)" />
            </Pressable>
          </View>

          <Glass>
            <Text style={styles.kicker}>Evento</Text>
            <View style={styles.eventRow}>
              <Ionicons name="lock-closed" size={16} color={colors.blue} />
              <Text style={styles.eventName} numberOfLines={1}>
                {event.name || 'Evento exclusivo'}
              </Text>
              <Text style={styles.exclusive}>Exclusivo</Text>
            </View>
            <Text style={styles.hint}>Esta portaria valida somente ingressos deste evento.</Text>
          </Glass>

          <Glass style={styles.scannerCard}>
            <View style={styles.scannerHead}>
              <Text style={styles.scannerTitle}>Scanner</Text>
              {cameraOn ? (
                <Pressable onPress={() => setCameraOn(false)} style={styles.stopBtn}>
                  <Ionicons name="stop-circle-outline" size={14} color="#fff" />
                  <Text style={styles.stopText}>Parar</Text>
                </Pressable>
              ) : (
                <GradientButton compact icon="camera-outline" label="Abrir câmera" onPress={() => void openCamera()} />
              )}
            </View>
            <View style={styles.preview}>
              {cameraOn && permission?.granted ? (
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={outcome || busy ? undefined : ({ data }) => void run(data)}
                />
              ) : null}
              {busy && !outcome ? (
                <View style={styles.busy}>
                  <Spinner size={32} color="#fff" />
                </View>
              ) : null}
                  {outcome ? (
                <View pointerEvents="none" style={[styles.overlay, { backgroundColor: OVERLAY[outcome.kind] }]}>
                  <Ionicons
                    name={
                      outcome.kind === 'valid'
                        ? 'checkmark-circle'
                        : outcome.kind === 'used' || outcome.kind === 'wrong_event' || outcome.kind === 'event_ended'
                          ? 'alert-circle'
                          : 'close-circle'
                    }
                    size={88}
                    color="#fff"
                  />
                  <Text style={styles.overlayText}>{outcome.message}</Text>
                </View>
              ) : null}
            </View>
          </Glass>

          <Glass>
            <Text style={styles.kicker}>Código manual</Text>
            <View style={styles.manualRow}>
              <TextInput
                value={manual}
                onChangeText={setManual}
                placeholder="Digite o código do ingresso"
                placeholderTextColor="rgba(255,255,255,0.40)"
                autoCapitalize="characters"
                autoCorrect={false}
                style={styles.input}
                onSubmitEditing={() => {
                  void run(manual);
                  setManual('');
                }}
              />
              <GradientButton
                label="Validar"
                onPress={() => {
                  void run(manual);
                  setManual('');
                }}
              />
            </View>
          </Glass>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={leaveOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setLeaveOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setLeaveOpen(false)} />
          <View style={styles.modalCard}>
            <NeonCard>
              <Ionicons name="exit-outline" size={28} color={colors.blue} style={styles.modalIcon} />
              <Text style={styles.modalTitle}>Trocar evento</Text>
              <Text style={styles.modalText}>
                Sair desta portaria e informar outro token?
              </Text>
              <View style={styles.modalActions}>
                <Pressable onPress={() => setLeaveOpen(false)} style={styles.modalCancel}>
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </Pressable>
                <Pressable onPress={() => void leaveEvent()} style={styles.modalLeaveWrap}>
                  <LinearGradient
                    colors={['#007BFF', '#0056b3']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.modalLeave}
                  >
                    <Text style={styles.modalLeaveText}>Sair</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </NeonCard>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  boot: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  page: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  header: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  exitBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingLeft: 8,
  },
  glass: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16,
    padding: 12,
  },
  kicker: {
    color: 'rgba(255,255,255,0.60)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  eventRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  eventName: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  exclusive: {
    color: 'rgba(255,255,255,0.60)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  hint: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.60)',
    fontSize: 12,
  },
  scannerCard: {
    flex: 1,
    minHeight: 0,
  },
  scannerHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  scannerTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 10,
    height: 32,
    paddingHorizontal: 12,
  },
  stopText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  preview: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    borderRadius: 10,
    backgroundColor: '#000',
  },
  busy: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5,13,31,0.55)',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  overlayText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  manualRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    color: colors.text,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 0,
    fontSize: 14,
    lineHeight: 18,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  gradientBtn: {
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  gradientBtnCompact: {
    height: 32,
    paddingHorizontal: 12,
  },
  gradientText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  gradientTextCompact: {
    fontSize: 12,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(5, 13, 31, 0.78)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
  },
  modalIcon: {
    alignSelf: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancel: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  modalCancelText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 15,
  },
  modalLeaveWrap: {
    flex: 1,
  },
  modalLeave: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLeaveText: {
    color: colors.loginText,
    fontWeight: '700',
    fontSize: 15,
  },
});
