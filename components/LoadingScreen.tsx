import React from "react";
import { StyleSheet, ImageBackground } from "react-native";

export default function LoadingScreen() {
  return (
    <ImageBackground
      source={require("./loadingscreen.png")} // Replace with the correct path
      style={styles.background}
      resizeMode="stretch" // Stretches the image to fit the screen size
    />
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1, // Ensures the container takes the full screen
    width: "100%", // Stretches the image to cover the full width
    height: "100%", // Stretches the image to cover the full height
  },
});
