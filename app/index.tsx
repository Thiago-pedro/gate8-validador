import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';
import { useEventSession } from '@/lib/event-context';

export default function SplashIndex() {
  const router = useRouter();
  const { event, loading } = useEventSession();
  const routed = useRef(false);

  useEffect(() => {
    if (loading || routed.current) return;
    const timer = setTimeout(() => {
      routed.current = true;
      router.replace(event ? '/scan' : '/login');
    }, 1600);
    return () => clearTimeout(timer);
  }, [event, loading, router]);

  return (
    <View style={styles.splash}>
      <Image source={require('../assets/images/splash-portaria.png')} style={styles.eight} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eight: {
    width: 192,
    height: 192,
  },
});
