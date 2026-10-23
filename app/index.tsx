import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { useEventSession } from '@/lib/event-context';

export default function SplashIndex() {
  const router = useRouter();
  const { event, loading } = useEventSession();
  const routed = useRef(false);

  useEffect(() => {
    if (loading || routed.current) return;
    routed.current = true;
    router.replace(event ? '/scan' : '/login');
  }, [event, loading, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (routed.current) return;
      routed.current = true;
      router.replace('/login');
    }, 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return <View style={styles.splash} />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
