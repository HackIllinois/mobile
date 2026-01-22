import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SvgUri } from "react-native-svg";

import { db, auth } from "../../src/firebase/firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { uploadImageAsync } from "../../src/firebase/uploadImage";

type Step = 0 | 1 | 2;

const TRACKS = [
  { key: "Hardware", label: "Hardware" },
  { key: "Software", label: "Software" },
  { key: "Design", label: "Design" },
  { key: "Logistics", label: "Logistics" },
];

function MentorshipBackground() {
  const uri = Image.resolveAssetSource(
    require("../../assets/mentorship/mentorship_bg.svg")
  ).uri;

  return (
    <SvgUri
      uri={uri}
      width="100%"
      height="100%"
      style={StyleSheet.absoluteFillObject}
      preserveAspectRatio="xMidYMid slice"
    />
  );
}

export default function MentorSupport() {
  const [step, setStep] = useState<Step>(0);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [track, setTrack] = useState("");
  const [image, setImage] = useState<string | null>(null);

  const [submittedRequests, setSubmittedRequests] = useState<any[]>([]);
  const [viewingRequests, setViewingRequests] = useState(false);

  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    track?: string;
  }>({});

  const dots = useMemo(() => [0, 1, 2] as const, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const removeImage = () => setImage(null);

  const validateInputs = () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "Please enter your name.";
    if (!description.trim()) newErrors.description = "Please describe your issue.";
    if (!track) newErrors.track = "Please select a category.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateInputs()) return;

    try {
      let imageUrl: string | null = null;
      if (image) imageUrl = await uploadImageAsync(image);

      if (db) {
        await addDoc(collection(db, "requests"), {
          name,
          description,
          track,
          imageUrl,
          status: "Pending",
          timestamp: serverTimestamp(),
        });
      }

      const dummyRequest = {
        id: submittedRequests.length + 1,
        name,
        description,
        track,
        image,
        status: "Pending",
        timestamp: new Date().toLocaleString(),
      };
      setSubmittedRequests([...submittedRequests, dummyRequest]);

      Alert.alert("Submitted!", "Your request has been recorded.");

      // reset
      setDescription("");
      setTrack("");
      setImage(null);
      setErrors({});
      setStep(0);
    } catch (err) {
      console.error("Error submitting request:", err);
      Alert.alert("Error", "Something went wrong submitting your request.");
    }
  };


  if (viewingRequests) {
    return (
      <SafeAreaView style={styles.screen}>
        <MentorshipBackground />
        <View style={styles.overlay} />

        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>My Requests</Text>

            {submittedRequests.length === 0 ? (
              <Text style={styles.muted}>No requests yet.</Text>
            ) : (
              submittedRequests.map((req) => (
                <View key={req.id} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <Text style={styles.requestTrack}>{req.track}</Text>
                    <View
                      style={[
                        styles.statusChip,
                        { opacity: 0.95 },
                        req.status === "Pending" ? styles.statusPending : styles.statusDone,
                      ]}
                    >
                      <Text style={styles.statusText}>{req.status}</Text>
                    </View>
                  </View>

                  <Text style={styles.requestName}>{req.name}</Text>
                  <Text style={styles.requestTime}>{req.timestamp}</Text>
                  <Text style={styles.requestDesc}>{req.description}</Text>

                  {req.image && (
                    <Image source={{ uri: req.image }} style={styles.requestImage} />
                  )}
                </View>
              ))
            )}

            <TouchableOpacity
              style={[styles.primaryBtn, { marginTop: 16 }]}
              onPress={() => setViewingRequests(false)}
            >
              <Text style={styles.primaryBtnText}>Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <MentorshipBackground />
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* <View style={styles.topRight}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>⌁</Text>
            </View>
          </View> */}

          {}
          {step === 0 && (
            <View style={styles.card}>
              <Text style={styles.hello}>
                Hello, <Text style={styles.bold}>traveler</Text>
              </Text>
              <Text style={styles.subtitle}>How can we help you today?</Text>

              <View style={{ height: 18 }} />

              <TouchableOpacity style={styles.bigGhostBtn} onPress={() => setStep(1)}>
                <Text style={styles.bigGhostBtnText}>Request mentorship</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.bigGhostBtn}
                onPress={() => setViewingRequests(true)}
              >
                <Text style={styles.bigGhostBtnText}>View past requests</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.bigGhostBtn}
                onPress={() => Alert.alert("Tip", "You can add another action here.")}
              >
                <Text style={styles.bigGhostBtnText}>Something else</Text>
              </TouchableOpacity>
            </View>
          )}

          {}
          {step === 1 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Mentorship Request</Text>
              <Text style={styles.sectionLabel}>Select Category</Text>

              <View style={styles.grid}>
                {TRACKS.map((t) => {
                  const selected = track === t.key;
                  return (
                    <TouchableOpacity
                      key={t.key}
                      style={[styles.gridItem, selected && styles.gridItemSelected]}
                      onPress={() => {
                        setTrack(t.key);
                        if (errors.track) setErrors((e) => ({ ...e, track: undefined }));
                        setStep(2);
                      }}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.gridText, selected && styles.gridTextSelected]}>
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {errors.track && <Text style={styles.errorText}>{errors.track}</Text>}

              <TouchableOpacity style={styles.linkBtn} onPress={() => setStep(0)}>
                <Text style={styles.linkText}>Back</Text>
              </TouchableOpacity>
            </View>
          )}

          {}
          {step === 2 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Mentorship Request</Text>

              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Enter your name"
                placeholderTextColor="#9aa3ad"
                value={name}
                onChangeText={(v) => {
                  setName(v);
                  if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
                }}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

              <Text style={[styles.label, { marginTop: 12 }]}>Request Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea, errors.description && styles.inputError]}
                placeholder="Describe what you need help with..."
                placeholderTextColor="#9aa3ad"
                multiline
                value={description}
                onChangeText={(v) => {
                  setDescription(v);
                  if (errors.description) setErrors((e) => ({ ...e, description: undefined }));
                }}
              />
              {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}

              <View style={styles.selectedRow}>
                <Text style={styles.muted}>Category:</Text>
                <Text style={styles.selectedPill}>{track || "None"}</Text>
                <TouchableOpacity onPress={() => setStep(1)} style={{ marginLeft: "auto" }}>
                  <Text style={styles.linkText}>Change</Text>
                </TouchableOpacity>
              </View>

              <View style={{ marginTop: 10 }}>
                <TouchableOpacity style={styles.ghostBtn} onPress={pickImage}>
                  <Text style={styles.ghostBtnText}>
                    {image ? "Change image" : "Upload image (optional)"}
                  </Text>
                </TouchableOpacity>

                {image && (
                  <View style={styles.imageWrap}>
                    <Image source={{ uri: image }} style={styles.preview} />
                    <TouchableOpacity onPress={removeImage} style={styles.removeBtn}>
                      <Text style={{ color: "#fff", fontWeight: "800" }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
                <Text style={styles.primaryBtnText}>Submit my request</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.linkBtn} onPress={() => setViewingRequests(true)}>
                <Text style={styles.linkText}>View past requests</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {}
        <View style={styles.dotsBar}>
          <View style={styles.dotsInner}>
            {dots.map((d) => (
              <View
                key={d}
                style={[styles.dot, step === d ? styles.dotActive : styles.dotInactive]}
              />
            ))}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0b0f14",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  scroll: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 120,
  },

  topRight: {
    alignItems: "flex-end",
    marginBottom: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { color: "#e9eef5", fontWeight: "700" },

  card: {
    backgroundColor: "rgba(15, 20, 28, 0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: 18,
  },

  hello: { color: "#eaf0f7", fontSize: 22, fontWeight: "700" },
  bold: { fontWeight: "900" },
  subtitle: { color: "#b9c3cf", marginTop: 6 },

  cardTitle: {
    color: "#eaf0f7",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
  },
  sectionLabel: { color: "#b9c3cf", fontWeight: "700", marginBottom: 12 },

  label: { color: "#cfe0f0", fontWeight: "700", marginBottom: 6 },

  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#eaf0f7",
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: "rgba(255, 90, 90, 0.9)",
  },
  errorText: {
    marginTop: 6,
    color: "#ff6b6b",
    fontWeight: "700",
  },

  muted: { color: "#b9c3cf", marginTop: 8 },

  bigGhostBtn: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  bigGhostBtnText: {
    color: "#eaf0f7",
    fontWeight: "800",
    textAlign: "center",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  gridItem: {
    width: "48%",
    height: 110,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  gridItemSelected: {
    backgroundColor: "rgba(120, 170, 255, 0.20)",
    borderColor: "rgba(120, 170, 255, 0.55)",
  },
  gridText: { color: "#eaf0f7", fontWeight: "900" },
  gridTextSelected: { color: "#dbe9ff" },

  selectedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },
  selectedPill: {
    color: "#eaf0f7",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden",
    fontWeight: "800",
  },

  ghostBtn: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  ghostBtnText: { color: "#eaf0f7", fontWeight: "800" },

  imageWrap: { marginTop: 10 },
  preview: { width: "100%", height: 170, borderRadius: 14 },
  removeBtn: {
    position: "absolute",
    right: 10,
    top: 10,
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: "rgba(255, 90, 90, 0.95)",
    alignItems: "center",
    justifyContent: "center",
  },

  primaryBtn: {
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: { color: "#eaf0f7", fontWeight: "900" },

  linkBtn: { marginTop: 12, alignItems: "center" },
  linkText: { color: "#cfe0f0", fontWeight: "800", textDecorationLine: "underline" },

  requestCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
  },
  requestHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  requestTrack: { color: "#eaf0f7", fontWeight: "900" },
  requestName: { color: "#eaf0f7", marginTop: 8, fontWeight: "700" },
  requestTime: { color: "#b9c3cf", fontSize: 12, marginTop: 2 },
  requestDesc: { color: "#d7e1ec", marginTop: 10 },
  requestImage: { width: "100%", height: 150, borderRadius: 12, marginTop: 10 },

  statusChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  statusText: { fontWeight: "900", color: "#0b0f14" },
  statusPending: { backgroundColor: "rgba(255, 209, 102, 0.95)" },
  statusDone: { backgroundColor: "rgba(6, 214, 160, 0.95)" },

  dotsBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 18,
    paddingTop: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.10)",
  },
  dotsInner: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  dotActive: {
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  dotInactive: {
    backgroundColor: "rgba(255,255,255,0.35)",
  },
});
