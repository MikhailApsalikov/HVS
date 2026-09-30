import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Canvas, ImageSVG, Skia, type SkSVG } from '@shopify/react-native-skia';
import { SVG } from './generated/resources';
import { colors, styles } from './theme';
const cache = new Map<string, SkSVG | null>();
export function svgImage(name: string, xml?: string): SkSVG | null {
  if (!cache.has(name))
    cache.set(
      name,
      Skia.SVG.MakeFromString(xml ?? SVG[name] ?? '<svg xmlns="http://www.w3.org/2000/svg"/>'),
    );
  return cache.get(name) ?? null;
}
export const Icon = memo(function Icon({
  name,
  size = 36,
  xml,
}: {
  name: string;
  size?: number;
  xml?: string;
}) {
  const svg = svgImage(name, xml);
  return (
    <Canvas pointerEvents="none" style={{ width: size, height: size }}>
      {svg && <ImageSVG svg={svg} width={size} height={size} />}
    </Canvas>
  );
});
export function Button({
  title,
  onPress,
  disabled,
  primary,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary && styles.primary,
        disabled && styles.disabled,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[styles.buttonText, primary && { color: colors.bg }]}>{title}</Text>
    </Pressable>
  );
}
export function Bar({
  value,
  max,
  color,
  label,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
}) {
  return (
    <View
      accessibilityLabel={`${label}: ${Math.ceil(value)} из ${Math.ceil(max)}`}
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        height: 26,
        borderRadius: 7,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${Math.min(100, Math.max(0, (value / Math.max(1, max)) * 100))}%`,
          backgroundColor: color,
          opacity: 0.55,
        }}
      />
      <Text
        maxFontSizeMultiplier={1.15}
        style={{
          color: colors.text,
          fontSize: 11,
          fontWeight: '700',
          textAlign: 'center',
          paddingTop: 5,
        }}
      >
        {label} {Math.ceil(value)} / {Math.ceil(max)}
      </Text>
    </View>
  );
}
