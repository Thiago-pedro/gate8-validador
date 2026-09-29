import { LinearGradient } from 'expo-linear-gradient';
import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, Keyboard, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';

const KEYBOARD_LIFT = 100;

type AuthKeyboardValue = {
  keyboardOpen: boolean;
  ensureVisible: (node: View | null) => void;
};

const AuthKeyboardContext = createContext<AuthKeyboardValue>({
  keyboardOpen: false,
  ensureVisible: () => undefined,
});

export function useAuthKeyboard() {
  return useContext(AuthKeyboardContext);
}

export function AuthScreenShell({
  children,
  header,
  footer,
}: {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
}) {
  const lift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    function animate(toValue: number, duration?: number) {
      Animated.timing(lift, {
        toValue,
        duration: duration && duration > 0 ? duration : 250,
        easing: Easing.bezier(0.17, 0.59, 0.4, 0.77),
        useNativeDriver: true,
      }).start();
    }

    const show = Keyboard.addListener(showEvent, (event) => {
      animate(-KEYBOARD_LIFT, event.duration);
    });
    const hide = Keyboard.addListener(hideEvent, (event) => {
      animate(0, event.duration);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [lift]);

  return (
    <AuthKeyboardContext.Provider value={{ keyboardOpen: false, ensureVisible: () => undefined }}>
      <View style={styles.root}>
        <LinearGradient
          colors={['rgba(0, 123, 255, 0.22)', colors.bg, colors.bg]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.root} edges={['top']}>
          {header}
          <Animated.View style={[styles.content, { transform: [{ translateY: lift }] }]}>
            {children}
          </Animated.View>
        </SafeAreaView>
        {footer ? (
          <View pointerEvents="box-none" style={styles.footerSlot}>
            {footer}
          </View>
        ) : null}
      </View>
    </AuthKeyboardContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  footerSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
