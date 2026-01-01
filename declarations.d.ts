declare module "*.svg" {
  import React from "react";
  import { SvgProps } from "react-native-svg";
  const content: React.FC<SvgProps>;
  export default content;
}

declare module "react-native-typewriter" {
  import { Component } from "react";
  import { TextStyle } from "react-native";

  interface TypeWriterProps {
    typing?: number;
    initialDelay?: number;
    minDelay?: number;
    maxDelay?: number;
    delayMap?: Array<{ at: number | string; delay: number }>;
    onTypingEnd?: () => void;
    onTyped?: (text: string, pos: number) => void;
    style?: TextStyle;
    children?: string;
  }

  export default class TypeWriter extends Component<TypeWriterProps> {}
}