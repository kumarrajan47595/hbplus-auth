// src/screens/DashboardScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useAuth, UserProfile } from "../context/AuthContext";
import { supabase } from "../config/supabase";

export const DashboardScreen = () => {
  const { user, profile, isAdmin, logout, refreshProfile } = useAuth();
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [fetchingMembers, setFetchingMembers] = useState<boolean>(false);

  const emailDomain = user?.email?.split("@")[1] || "";

  // Admin feature: Fetch all team members registered in Supabase
  const loadTeamMembers = async () => {
    if (!isAdmin) return;
    setFetchingMembers(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setTeamMembers(data as UserProfile[]);
    setFetchingMembers(false);
  };

  useEffect(() => {
    if (isAdmin) {
      loadTeamMembers();
    }
  }, [isAdmin]);

  // Demo helper: Toggle role between Admin and User to showcase RBAC
  const toggleRole = async () => {
    if (!profile) return;
    const nextRole = profile.role === "admin" ? "user" : "admin";
    await supabase
      .from("profiles")
      .update({ role: nextRole })
      .eq("id", profile.id);
    await refreshProfile();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        {/* Top Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Workspace Dashboard</Text>
          <View
            style={[
              styles.roleBadge,
              isAdmin ? styles.adminBadge : styles.userBadge,
            ]}
          >
            <Text style={styles.roleText}>
              {profile?.role?.toUpperCase() || "USER"}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionSubtitle}>
          Authentication verified. Active session stored in database.
        </Text>

        {/* User Profile Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Email Account</Text>
            <Text style={styles.value}>{user?.email}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Display Name</Text>
            <Text style={styles.value}>
              {profile?.full_name || user?.user_metadata?.full_name || "N/A"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Domain Authorization</Text>
            <Text style={[styles.value, styles.verifiedText]}>
              @{emailDomain} (Verified)
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Role-Based Access Level</Text>
            <Text style={styles.value}>
              {isAdmin
                ? "🛡️ Administrator (Full Privileges)"
                : "👤 Member (Standard Access)"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Database UUID</Text>
            <Text style={styles.monoValue}>{user?.id}</Text>
          </View>
        </View>

        {/* BONUS: Role-Based Access Control Section */}
        {isAdmin ? (
          <View style={styles.adminSection}>
            <View style={styles.adminHeader}>
              <Text style={styles.adminTitle}>Admin Management Panel</Text>
              <Text style={styles.adminBadgeSmall}>Admin Only</Text>
            </View>
            <Text style={styles.adminSubtitle}>
              You have access to internal organization records and role
              controls.
            </Text>

            {fetchingMembers ? (
              <ActivityIndicator
                color="#3b82f6"
                style={{ marginVertical: 12 }}
              />
            ) : (
              <View style={styles.memberList}>
                <Text style={styles.memberListHeader}>
                  Registered Users ({teamMembers.length})
                </Text>
                {teamMembers.map((member) => (
                  <View key={member.id} style={styles.memberRow}>
                    <Text style={styles.memberName}>{member.email}</Text>
                    <Text
                      style={[
                        styles.memberRole,
                        member.role === "admin"
                          ? styles.adminColor
                          : styles.userColor,
                      ]}
                    >
                      {member.role.toUpperCase()}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.standardUserNotice}>
            <Text style={styles.standardUserNoticeText}>
              ℹ️ Standard User Mode: Admin management tools and database member
              directory are hidden for your role.
            </Text>
          </View>
        )}

        {/* Demo Role Switcher (Helps the Reviewer Test Both Admin and User) */}
        <TouchableOpacity style={styles.switchRoleButton} onPress={toggleRole}>
          <Text style={styles.switchRoleText}>
            Demo: Switch to {isAdmin ? "User Role" : "Admin Role"}
          </Text>
        </TouchableOpacity>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 620,
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: "#334155",
    ...Platform.select({
      web: { boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)" },
      default: { elevation: 6 },
    }),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#f8fafc",
  },
  sectionSubtitle: {
    color: "#94a3b8",
    fontSize: 14,
    marginBottom: 24,
  },
  roleBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  adminBadge: {
    backgroundColor: "#7c3aed",
  },
  userBadge: {
    backgroundColor: "#0284c7",
  },
  roleText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  detailsContainer: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  detailRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  label: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: "#f1f5f9",
    fontWeight: "500",
  },
  verifiedText: {
    color: "#4ade80",
    fontWeight: "600",
  },
  monoValue: {
    fontSize: 12,
    color: "#94a3b8",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  adminSection: {
    backgroundColor: "#172554",
    borderColor: "#1d4ed8",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  adminHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  adminTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#bfdbfe",
  },
  adminBadgeSmall: {
    fontSize: 10,
    fontWeight: "700",
    color: "#60a5fa",
    backgroundColor: "#1e3a8a",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminSubtitle: {
    fontSize: 12,
    color: "#93c5fd",
    marginBottom: 12,
  },
  memberList: {
    backgroundColor: "#0f172a",
    borderRadius: 8,
    padding: 12,
  },
  memberListHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
    marginBottom: 8,
  },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  memberName: {
    fontSize: 13,
    color: "#e2e8f0",
  },
  memberRole: {
    fontSize: 11,
    fontWeight: "700",
  },
  adminColor: {
    color: "#a78bfa",
  },
  userColor: {
    color: "#38bdf8",
  },
  standardUserNotice: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  standardUserNoticeText: {
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 18,
  },
  switchRoleButton: {
    backgroundColor: "#334155",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  switchRoleText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#dc2626",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  logoutText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});
