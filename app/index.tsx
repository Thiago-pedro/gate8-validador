import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { useEventSession } from '@/lib/event-context';

const SPLASH = require('../assets/images/splash-portaria.png');

export default function SplashIndex() {
  const router = useRouter();
  const { event, loading } = useEventSession();
  const routed = useRef(false);
  const [holdDone, setHoldDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHoldDone(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!holdDone || loading || routed.current) return;
    routed.current = true;
    router.replace(event ? '/scan' : '/login');
  }, [event, holdDone, loading, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (routed.current) return;
      routed.current = true;
      router.replace('/login');
    }, 2500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.splash}>
      <Image
        source={SPLASH}
        resizeMode="cover"
        fadeDuration={0}
        onLoad={() => {
          void SplashScreen.hideAsync();
        }}
        style={styles.full}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#000000',
  },
  full: {
    width: '100%',
    height: '100%',
  },
});
