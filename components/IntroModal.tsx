import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export type IntroAction = {
  text: string;
  onPress: () => void;
  type?: 'primary' | 'secondary' | 'danger';
};

type IntroModalProps = {
  visible: boolean;
  title?: string;
  description?: string;
  bullets?: string[]; // 新增：传入要点数组，自动渲染为项目符号
  onClose: () => void;
  actions?: IntroAction[];
  // 可选：自定义内容（会渲染在 description 与 bullets 之后）
  children?: React.ReactNode;
};

export default function IntroModal(props: IntroModalProps) {
  const { visible, title = '功能介绍', description, bullets, onClose, actions, children } = props;

  const colorScheme = useColorScheme() ?? 'light';
  const primary = Colors[colorScheme].tint;
  const textColor = colorScheme === 'dark' ? '#fff' : '#1c1c1c';
  const muted = colorScheme === 'dark' ? 'rgba(255,255,255,0.7)' : '#444';
  const hairline = colorScheme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  const bulletColor = colorScheme === 'dark' ? '#ddd' : '#444';

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <BlurView
          intensity={50}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFillObject}
        //   experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        />

        <View style={[styles.cardWrap, { borderColor: hairline }]}>
          <View style={styles.cardInner}>
            {!!title && <Text style={[styles.title, { color: textColor }]}>{title}</Text>}
            {!!description && <Text style={[styles.desc, { color: muted }]}>{description}</Text>}
            {!!bullets && bullets.length > 0 && (
              <View style={{ marginBottom: 6 }}>
                {bullets.map((item, idx) => (
                  <Text key={`bullet-${idx}`} style={{ fontSize: 14, color: bulletColor, lineHeight: 22 }}>
                    • {item}
                  </Text>
                ))}
              </View>
            )}
            {children}

            <View style={styles.actionsRow}>
              {(actions && actions.length > 0 ? actions : [{ text: '知道了', onPress: onClose, type: 'primary' }]).map(
                (action, idx) => {
                  const bg =
                    action.type === 'danger'
                      ? '#FF6347'
                      : action.type === 'secondary'
                      ? 'transparent'
                      : primary;
                  const isGhost = action.type === 'secondary';
                  const borderColor = isGhost ? hairline : 'transparent';
                  const textClr = isGhost ? (colorScheme === 'dark' ? '#ddd' : '#444') : '#fff';

                  return (
                    <Pressable
                      key={`${action.text}-${idx}`}
                      onPress={action.onPress}
                      style={({ pressed }) => [
                        styles.btn,
                        { backgroundColor: bg, borderColor },
                        pressed && styles.pressed,
                      ]}
                      android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={[styles.btnText, { color: textClr }]}>{action.text}</Text>
                    </Pressable>
                  );
                }
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  cardWrap: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    // 阴影
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
    backgroundColor:'#fff'
  },
  cardInner: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'left',
    marginBottom: 10,
  },
  actionsRow: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.92,
  },
});