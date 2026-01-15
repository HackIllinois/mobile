import { createContext, useContext, useMemo, useRef } from "react";
import { Animated } from "react-native";

type AnimationContextType = {
  cloudX1: Animated.Value;
  cloudX2: Animated.Value;
  starOpacity: Animated.Value;
};

const AnimationContext = createContext<AnimationContextType | null>(null);

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const cloudX1Ref = useRef(new Animated.Value(0));
  const cloudX2Ref = useRef(new Animated.Value(0));
  const starOpacityRef = useRef(new Animated.Value(0.8));

  const contextValue = useMemo(
    () => ({
      cloudX1: cloudX1Ref.current,
      cloudX2: cloudX2Ref.current,
      starOpacity: starOpacityRef.current,
    }),
    []
  );

  return (
    <AnimationContext.Provider value={contextValue}>
      {children}
    </AnimationContext.Provider>
  );
}

export function useAnimations() {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error("useAnimations must be used within AnimationProvider");
  }
  return context;
}
