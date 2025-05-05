// components/ui/sheet.tsx
import React, { createContext, useContext, ReactNode, useRef, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet, ViewStyle, Animated, Dimensions, Modal, TouchableWithoutFeedback } from "react-native";
import SideMenu from "../SideMenu";

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
  asChild?: boolean;
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
  children?: ReactNode;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

/**
 * <SheetContent> renders only when open = true
 */
export function SheetContent({ side = "right", style }: SheetContentProps) {
  const { open, onOpenChange } = useContext(SheetContext);
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_WIDTH,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [open, slideAnim, fadeAnim]);

  if (!open) return null;

  return (
    <Modal 
      visible={open} 
      transparent={true}
      animationType="none"
      onRequestClose={() => onOpenChange(false)}
    >
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={() => onOpenChange(false)}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>
        
        <Animated.View 
          style={[
            styles.sheetContent, 
            side === "right" && styles.sheetRight,
            { transform: [{ translateX: slideAnim }] },
            style
          ]}
        >
          <SideMenu closeDrawer={() => onOpenChange(false)} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    flexDirection: "row",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sheetContent: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 300,
    backgroundColor: "white",
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
