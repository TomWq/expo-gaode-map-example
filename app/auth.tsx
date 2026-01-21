import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAuth } from "@/store/useAuth";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";
import { toast } from "sonner-native";

export default function AuthScreen() {
  const { setPrivacyAgreed } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const tint = Colors[colorScheme].tint;
  const primary = colorScheme === "dark" ? "#4A90E2" : tint;
  const onPrimary = "#fff";
  const muted = colorScheme === "dark" ? "#aaa" : "#666";
  const mutedStrong = colorScheme === "dark" ? "#ddd" : "#444";
  const hairline = colorScheme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const cardBg = colorScheme === "dark" ? "#111" : "#fff";
  const ghostBorder = colorScheme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)";

 const [checked, setChecked] = useState(false);

 // 用户明确同意
 const handleAgreePrivacy = () => {
    try {
      
      setPrivacyAgreed(true);
    } catch {
      toast.error("设置隐私协议状态失败");
    }
  };

  // 用户明确不同意
  const handleDeclinePrivacy = () => {

    setPrivacyAgreed(false);
    toast.info("未同意隐私协议，地图与定位功能不可用");
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <ScrollView contentContainerStyle={styles.scroll} bounces={false} >
        <View style={[styles.logoCircle, { backgroundColor: primary }]}>
          <Text style={styles.logoText}>隐</Text>
        </View>

        <Text style={styles.title}>隐私政策与个人信息保护</Text>
        <Text style={[styles.subtitle, { color: muted }]}>
          为向你提供地图、定位与导航等服务，我们将依据隐私政策处理必要信息。请阅读并确认后继续。
        </Text>

        <View style={[styles.card, { backgroundColor: cardBg, borderColor: hairline }]}>
          <Text style={styles.sectionTitle}>我们如何使用你的信息</Text>
          <Text style={[styles.paragraph, { color: mutedStrong }]}>• 定位权限：用于获取当前位置与路径规划。</Text>
          <Text style={[styles.paragraph, { color: mutedStrong }]}>• 地图服务：用于展示地图、周边与检索结果。</Text>
          <Text style={[styles.paragraph, { color: mutedStrong }]}>• 仅在使用期间访问定位，未经授权不会收集。</Text>

          <View style={[styles.divider, { backgroundColor: hairline }]} />

          <Text style={styles.sectionTitle}>你的权利与选择</Text>
          <Text style={[styles.paragraph, { color: mutedStrong }]}>• 你可随时在系统设置中关闭定位权限。</Text>
          <Text style={[styles.paragraph, { color: mutedStrong }]}>• 不同意则无法使用地图与导航等相关功能。</Text>

          <Text style={[styles.note, { color: muted }]}>
            勾选并继续表示你已阅读并同意《隐私政策》与《用户协议》。
          </Text>
        </View>

        <View style={styles.consentRow}>
          <Pressable onPress={() => setChecked((v) => !v)} style={styles.checkboxBox}>
            {checked && <View style={[styles.checkboxInner, { backgroundColor: primary }]} />}
          </Pressable>
          <Text style={[styles.consentText, { color: muted }]}>
            我已阅读并同意
            <Text style={[styles.link, { color: primary }]}>《隐私政策》</Text>
            与
            <Text style={[styles.link, { color: primary }]}>《用户协议》</Text>
          </Text>
        </View>
 
        <View style={styles.actions}>
          <Pressable
            onPress={handleDeclinePrivacy}
            style={({ pressed }) => [styles.btn, styles.btnGhost, { borderColor: ghostBorder }, pressed && styles.pressed]}
          >
            <Text style={[styles.btnGhostText, { color: muted }]}>不同意</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              if (!checked) {
                toast.info("请先勾选并同意条款");
                return;
              }
              handleAgreePrivacy();
            }}
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: checked ? primary : ghostBorder },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.btnText, { color: checked ? onPrimary : muted }]}>同意并继续</Text>
          </Pressable>
        </View>

        <Text style={[styles.footerTip, { color: muted }]}>你可在系统设置中随时变更权限。</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
   
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
    justifyContent: "center",
    gap: 26,
  },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    // iOS 阴影
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    // Android 阴影
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 13,
    color: "#444",
    lineHeight: 20,
    marginBottom: 6,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginVertical: 12,
  },
  note: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
    marginTop: 4,
  },
  actions: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  btnGhost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    marginRight: 12,
  },
  btnGhostText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.85,
  },
 footerTip: {
   fontSize: 11,
   color: "#888",
   textAlign: "center",
   marginTop: 10,
 },
 consentRow: {
   flexDirection: "row",
   alignItems: "center",
   gap: 10,
   marginTop: -6,
 },
 checkboxBox: {
   width: 18,
   height: 18,
   borderRadius: 4,
   borderWidth: 1,
   borderColor: "#bbb",
   alignItems: "center",
   justifyContent: "center",
 },
 checkboxInner: {
   width: 12,
   height: 12,
   borderRadius: 3,
 },
 consentText: {
   flex: 1,
   fontSize: 12,
   lineHeight: 18,
 },
 link: {
   textDecorationLine: "underline",
   fontWeight: "600",
 },
});