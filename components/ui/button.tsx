// components/ui/button.tsx
import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
} from "react-native";

export interface ButtonProps {
  children: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "icon" | "sm" | "lg";
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  children,
  onPress,
  variant = "default",
  size = "default",
  style,
  textStyle,
}: ButtonProps) {
  const buttonStyles = [
    styles.button,
    variantStyles[variant],
    sizeStyles[size],
    style,
  ];

  const content =
    typeof children === "string" ? (
      <Text style={[styles.text, textVariantStyles[variant], textStyle]}>
        {children}
      </Text>
    ) : (
      children
    );

  return (
    <TouchableOpacity onPress={onPress} style={buttonStyles}>
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 16,
  },
});

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, ViewStyle> = {
  default: {
    backgroundColor: "#006a4d",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#006a4d",
  },
};

const textVariantStyles: Record<NonNullable<ButtonProps["variant"]>, TextStyle> = {
  default: {
    color: "#fff",
  },
  ghost: {
    color: "#006a4d",
  },
  outline: {
    color: "#006a4d",
  },
};

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, ViewStyle> = {
  default: {},
  icon: {
    padding: 8,
  },
  sm: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  lg: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
};

export default Button;
