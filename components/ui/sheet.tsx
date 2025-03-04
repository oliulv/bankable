// components/ui/sheet.tsx
import React, { createContext, useContext, ReactNode } from "react";
import { View, TouchableOpacity, StyleSheet, ViewStyle } from "react-native";

/**
 * Context to store the sheet's open state and toggle function
 */
interface SheetContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SheetContext = createContext<SheetContextValue>({
  open: false,
  onOpenChange: () => {},
});

/**
 * <Sheet> props
 */
interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

/**
 * The main <Sheet> component that provides context
 */
export function Sheet({ open, onOpenChange, children }: SheetProps) {
  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
}

/**
 * <SheetTrigger> props
 */
interface SheetTriggerProps {
  children: ReactNode;
  asChild?: boolean; // Not used in this simple example
}

/**
 * <SheetTrigger> toggles the sheet open/closed
 */
export function SheetTrigger({ children }: SheetTriggerProps) {
  const { open, onOpenChange } = useContext(SheetContext);

  return (
    <TouchableOpacity onPress={() => onOpenChange(!open)}>
      {children}
    </TouchableOpacity>
  );
}

/**
 * <SheetContent> props
 */
interface SheetContentProps {
  side?: "right" | "left";
  style?: ViewStyle;
  children: ReactNode;
}

/**
 * <SheetContent> renders only when open = true
 */
export function SheetContent({ side = "right", style, children }: SheetContentProps) {
  const { open } = useContext(SheetContext);

  if (!open) return null;

  return (
    <View style={[styles.sheetContent, side === "right" && styles.sheetRight, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 250,
    backgroundColor: "white",
    padding: 16,
    // Shadows
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: -2, height: 0 },
    elevation: 5,
  },
  sheetRight: {
    right: 0,
  },
});
