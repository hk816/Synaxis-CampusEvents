import { Ionicons } from '@expo/vector-icons';
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useState
} from 'react';
import {
    Animated,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { colors } from '../theme/colors';

type ToastType = 'success' | 'error' | 'info' | 'warning';

type ToastData = {
  message: string;
  type: ToastType;
};

type ToastContextType = {
  showToast: (
    message: string,
    type?: ToastType
  ) => void;
};

const ToastContext =
  createContext<ToastContextType | null>(null);

export function ToastProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [toast, setToast] =
    useState<ToastData | null>(null);

  const [animation] = useState(
    new Animated.Value(0)
  );

  const showToast = useCallback(
    (
      message: string,
      type: ToastType = 'success'
    ) => {
      setToast({
        message,
        type,
      });

      Animated.spring(animation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 70,
        friction: 8,
      }).start();

      setTimeout(() => {
        Animated.timing(animation, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }).start(() => {
          setToast(null);
        });
      }, 2600);
    },
    [animation]
  );

  const dismissToast = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setToast(null);
    });
  };

  const getIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (toast?.type) {
      case 'success':
        return 'checkmark-circle';

      case 'error':
        return 'close-circle';

      case 'warning':
        return 'warning';

      default:
        return 'information-circle';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {toast && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.wrapper,
            {
              opacity: animation,
              transform: [
                {
                  translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-25, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Pressable
            onPress={dismissToast}
            style={[
              styles.toast,
              toast.type === 'success' &&
                styles.success,
              toast.type === 'error' &&
                styles.error,
              toast.type === 'warning' &&
                styles.warning,
              toast.type === 'info' &&
                styles.info,
            ]}
          >
            <View style={styles.iconCircle}>
              <Ionicons
                name={getIcon()}
                size={22}
                color={colors.navy}
              />
            </View>

            <Text
              style={styles.message}
              numberOfLines={3}
            >
              {toast.message}
            </Text>

            <Ionicons
              name="close"
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error(
      'useToast must be used inside ToastProvider'
    );
  }

  return context;
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 9999,
  },

  toast: {
    minHeight: 62,
    borderRadius: 17,
    paddingHorizontal: 13,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },

  success: {
    borderColor: '#BBDCC8',
  },

  error: {
    borderColor: '#E9BABA',
  },

  warning: {
    borderColor: '#E7D19A',
  },

  info: {
    borderColor: '#C7D2E5',
  },

  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFF1C9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  message: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: colors.navy,
    marginRight: 8,
  },
});