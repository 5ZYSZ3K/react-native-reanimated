import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  createAnimatedPropAdapter,
  interpolate,
  Extrapolation,
  processColor,
  interpolateColor,
} from 'react-native-reanimated';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import React, { useCallback } from 'react';
import Svg, { Path } from 'react-native-svg';

interface Vector<T = number> {
  x: T;
  y: T;
}

interface Curve {
  to: Vector;
  c1: Vector;
  c2: Vector;
}

type PathType = {
  move: Vector;
  curves: Curve[];
  close: boolean;
};

const serialize = (path: PathType) => {
  'worklet';
  return `M${path.move.x},${path.move.y} ${path.curves
    .map((c) => `C${c.c1.x},${c.c1.y} ${c.c2.x},${c.c2.y} ${c.to.x},${c.to.y}`)
    .join(' ')}${path.close ? 'Z' : ''}`;
};

const interpolatePath = (
  value: number,
  inputRange: number[],
  outputRange: PathType[],
  extrapolate = Extrapolation.CLAMP
) => {
  'worklet';
  const path = {
    move: {
      x: interpolate(
        value,
        inputRange,
        outputRange.map((p) => p.move.x),
        extrapolate
      ),
      y: interpolate(
        value,
        inputRange,
        outputRange.map((p) => p.move.y),
        extrapolate
      ),
    },
    curves: outputRange[0].curves.map((_, index) => ({
      c1: {
        x: interpolate(
          value,
          inputRange,
          outputRange.map((p) => p.curves[index].c1.x),
          extrapolate
        ),
        y: interpolate(
          value,
          inputRange,
          outputRange.map((p) => p.curves[index].c1.y),
          extrapolate
        ),
      },
      c2: {
        x: interpolate(
          value,
          inputRange,
          outputRange.map((p) => p.curves[index].c2.x),
          extrapolate
        ),
        y: interpolate(
          value,
          inputRange,
          outputRange.map((p) => p.curves[index].c2.y),
          extrapolate
        ),
      },
      to: {
        x: interpolate(
          value,
          inputRange,
          outputRange.map((p) => p.curves[index].to.x),
          extrapolate
        ),
        y: interpolate(
          value,
          inputRange,
          outputRange.map((p) => p.curves[index].to.y),
          extrapolate
        ),
      },
    })),
    close: outputRange[0].close,
  };
  return serialize(path);
};

export const mixPath = (
  value: number,
  p1: PathType,
  p2: PathType,
  extrapolate = Extrapolation.CLAMP
) => {
  'worklet';
  return interpolatePath(value, [0, 1], [p1, p2], extrapolate);
};

const PATH_1 = {
  move: { x: 0, y: 3 },
  curves: [
    {
      c1: { x: 16, y: 3 },
      c2: { x: 16, y: 3 },
      to: { x: 16, y: 3 },
    },
    {
      c1: { x: 8, y: 13 },
      c2: { x: 8, y: 13 },
      to: { x: 8, y: 13 },
    },
    {
      c1: { x: 0, y: 3 },
      c2: { x: 0, y: 3 },
      to: { x: 0, y: 3 },
    },
  ],
  close: false,
};

const PATH_2 = {
  move: { x: 0, y: 13 },
  curves: [
    {
      c1: { x: 8, y: 3 },
      c2: { x: 8, y: 3 },
      to: { x: 8, y: 3 },
    },
    {
      c1: { x: 16, y: 13 },
      c2: { x: 16, y: 13 },
      to: { x: 16, y: 13 },
    },
    {
      c1: { x: 0, y: 13 },
      c2: { x: 0, y: 13 },
      to: { x: 0, y: 13 },
    },
  ],
  close: false,
};

const AnimatedPath = Animated.createAnimatedComponent(Path);

const fillAdapter = createAnimatedPropAdapter(
  (props: Record<string, unknown>) => {
    if (Object.keys(props).includes('fill')) {
      props.fill = { type: 0, payload: processColor(props.fill) };
    }
  },
  ['fill']
);

export default function AmountExample() {
  const sv = useSharedValue(0);

  const animatedProps = useAnimatedProps(
    () => {
      return {
        d: mixPath(sv.value, PATH_1, PATH_2, Extrapolation.CLAMP),
        fill: interpolateColor(sv.value, [0, 1], ['#ff0000', '#00ff00']),
      };
    },
    undefined,
    [fillAdapter]
  );

  const toggleValue = useCallback(() => {
    'worklet';
    sv.value = withTiming(sv.value === 0 ? 1 : 0);
  }, [sv]);

  return (
    <View style={styles.container}>
      <Svg width={100} height={100} viewBox="0 0 16 16">
        <AnimatedPath animatedProps={animatedProps} />
      </Svg>
      <Pressable onPress={toggleValue}>
        <Text>Switch</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
