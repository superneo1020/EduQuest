import {
  Dimensions,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React from "react";
import { router } from "expo-router";

const { height, width } = Dimensions.get("window");

export default function Welcome() {
  return (
    <SafeAreaView style={styles.container}>

      {/* Centered Image */}
      <View style={styles.imageWrapper}>
        <Image
          source={require("../../assets/images/Welcome-Image.png")} //
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>Welcome to EduQuest!</Text>

      <Text style={styles.subtitle}>
        Learn through Games • Grow with Fun • Challenge Yourself
      </Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          onPress={() => router.push("/Profile/Login")}
          style={styles.loginButton}
        >
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/Profile/Register")}
          style={styles.registerButton}
        >
          <Text style={styles.registerText}>Register</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", backgroundColor: "#FFF" },

  imageWrapper: {
    marginTop: 40,
    width: width * 0.9,
    height: height * 0.32,
    alignItems: "center",
    justifyContent: "center",
  },

  image: {
    width: "90%",
    height: "90%",
  },

  title: {
    marginTop: 20,
    fontSize: 30,
    fontWeight: "bold",
    color: "#4CAF50",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 15,
    textAlign: "center",
    color: "#555",
    paddingHorizontal: 40,
    marginTop: 14,
  },

  buttonRow: {
    flexDirection: "row",
    marginTop: 50,
    width: "75%",
    justifyContent: "space-between",
  },

  loginButton: {
    backgroundColor: "#4CAF50",
    width: "48%",
    paddingVertical: 14,
    borderRadius: 10,
  },
  loginText: {
    color: "#FFF",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 18,
  },

  registerButton: {
    borderWidth: 2,
    borderColor: "#4CAF50",
    width: "48%",
    paddingVertical: 14,
    borderRadius: 10,
  },
  registerText: {
    color: "#4CAF50",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 18,
  },
});