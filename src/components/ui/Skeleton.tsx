import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { Animated, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';

const SkeletonPulseContext = createContext<Animated.Value | null>(null);

type SkeletonGroupProps = {
  children: ReactNode;
};

export function SkeletonGroup({ children }: SkeletonGroupProps) {
  const existing = useContext(SkeletonPulseContext);
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    if (existing) {
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 750, useNativeDriver: true }),
      ]),
    );
    loop.start();

    return () => loop.stop();
  }, [existing, opacity]);

  if (existing) {
    return <>{children}</>;
  }

  return <SkeletonPulseContext.Provider value={opacity}>{children}</SkeletonPulseContext.Provider>;
}

type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({ width = '100%', height = 12, radius = 8, style }: SkeletonProps) {
  const shared = useContext(SkeletonPulseContext);
  const local = useRef(new Animated.Value(0.45)).current;
  const opacity = shared ?? local;

  useEffect(() => {
    if (shared) {
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(local, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(local, { toValue: 0.45, duration: 750, useNativeDriver: true }),
      ]),
    );
    loop.start();

    return () => loop.stop();
  }, [local, shared]);

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: '#E6EDF5', opacity }, style]}
    />
  );
}

export function ProductCardSkeleton({ width }: { width: number }) {
  const frameHeight = Math.round(width * 0.92);

  return (
    <View style={{ width, marginBottom: 12 }}>
      <Skeleton width={width} height={frameHeight} radius={12} />
      <Skeleton width={Math.round(width * 0.55)} height={8} style={{ marginTop: 8 }} />
      <Skeleton width={Math.round(width * 0.42)} height={12} style={{ marginTop: 6 }} />
      <Skeleton width={Math.round(width * 0.86)} height={10} style={{ marginTop: 6 }} />
    </View>
  );
}

type ProductGridSkeletonProps = {
  columns: number;
  cardWidth: number;
  rows?: number;
  padding?: number;
  gap?: number;
};

export function ProductGridSkeleton({
  columns,
  cardWidth,
  rows = 2,
  padding = 12,
  gap = 8,
}: ProductGridSkeletonProps) {
  return (
    <SkeletonGroup>
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} style={{ flexDirection: 'row', gap, paddingHorizontal: padding }}>
          {Array.from({ length: columns }, (_, column) => (
            <ProductCardSkeleton key={`${row}-${column}`} width={cardWidth} />
          ))}
        </View>
      ))}
    </SkeletonGroup>
  );
}
