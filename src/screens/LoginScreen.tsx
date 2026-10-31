import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useAuth, ALLOWED_DOMAIN } from "../context/AuthContext";

export const LoginScreen = () => {
  const { loginWithGoogle, loading, error, clearError } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.brandIcon}>
          <Text style={styles.brandLetter}>HB</Text>
        </View>

        <Text style={styles.title}>Welcome to HBPlus Portal</Text>
        <Text style={styles.subtitle}>
          Sign in to access your organization dashboard and internal tools.
        </Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>Restricted to {ALLOWED_DOMAIN}</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.googleButton, loading && styles.buttonDisabled]}
          onPress={() => {
            clearError();
            loginWithGoogle();
          }}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#0f172a" />
          ) : (
            <View style={styles.buttonContent}>
              <Text style={styles.googleIconText}>G</Text>
              <Text style={styles.buttonText}>Sign in with Google</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Non-{ALLOWED_DOMAIN} email addresses will be rejected automatically.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
    ...Platform.select({
      web: { boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.4)" },
      default: { elevation: 8 },
    }),
  },
  brandIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  brandLetter: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  badge: {
    backgroundColor: "#1e3a8a",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginBottom: 24,
  },
  badgeText: {
    color: "#93c5fd",
    fontSize: 12,
    fontWeight: "600",
  },
  errorBox: {
    width: "100%",
    backgroundColor: "#7f1d1d",
    borderColor: "#b91c1c",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: "#fecaca",
    fontSize: 13,
    textAlign: "center",
  },
  googleButton: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  googleIconText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4285F4",
    marginRight: 10,
  },
  buttonText: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "600",
  },
  footerText: {
    marginTop: 20,
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
  },
});
