import React, { useState } from "react";
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
  Platform
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { db } from "../../src/firebase/firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { uploadImageAsync } from "../../src/firebase/uploadImage";

export default function SupportRequestScreen() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [track, setTrack] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [submittedRequests, setSubmittedRequests] = useState<any[]>([]);
  const [viewingRequests, setViewingRequests] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; description?: string; track?: string }>({});

  const tracks = ["Hardware", "Software", "Design", "Logistics"];

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const removeImage = () => setImage(null);

  const validateInputs = () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "Please enter your name.";
    if (!description.trim()) newErrors.description = "Please describe your issue.";
    if (!track) newErrors.track = "Please select a track.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateInputs()) return;

    try {
      let imageUrl = null;
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
      } else {
        // Firebase not yet configured — local fallback
        console.log("Firebase not connected. Using local storage.");
      }

      Alert.alert("Submitted!", "Your request has been recorded.");
      setDescription("");
      setTrack("");

    } catch (err) {
      console.error("Error submitting request:", err);
      Alert.alert("Error", "Something went wrong submitting your request.");
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
  };

  if (viewingRequests) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>My Requests</Text>
          {submittedRequests.length === 0 ? (
            <Text style={{ color: "#777", marginTop: 20 }}>No requests yet.</Text>
          ) : (
            submittedRequests.map((req) => (
              <View key={req.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <Text style={styles.requestTitle}>{req.track}</Text>
                  <View
                    style={[
                      styles.statusChip,
                      { backgroundColor: req.status === "Pending" ? "#ffd166" : "#06d6a0" },
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
            style={[styles.submitButton, { marginTop: 30 }]}
            onPress={() => setViewingRequests(false)}
          >
            <Text style={styles.submitText}>Back to Form</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Submit a Support Request</Text>

          {/* Name Field */}
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={[styles.input, errors.name && styles.errorInput]}
            placeholder="Enter your name"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors({ ...errors, name: undefined });
            }}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

          {/* Description */}
          <Text style={styles.label}>Issue Description *</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              errors.description && styles.errorInput,
            ]}
            placeholder="Describe your issue..."
            multiline
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              if (errors.description) setErrors({ ...errors, description: undefined });
            }}
          />
          {errors.description && (
            <Text style={styles.errorText}>{errors.description}</Text>
          )}

          {/* Track */}
          <Text style={styles.label}>Select Track *</Text>
          <View style={styles.trackContainer}>
            {tracks.map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.trackButton,
                  track === t && styles.trackButtonSelected,
                ]}
                onPress={() => {
                  setTrack(t);
                  if (errors.track) setErrors({ ...errors, track: undefined });
                }}
              >
                <Text
                  style={[
                    styles.trackText,
                    track === t && styles.trackTextSelected,
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.track && <Text style={styles.errorText}>{errors.track}</Text>}

          {}
          <View style={{ marginTop: 10 }}>
            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              <Text style={styles.imageButtonText}>
                {image ? "Change Image" : "Upload Image (optional)"}
              </Text>
            </TouchableOpacity>

            {image && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: image }} style={styles.preview} />
                <TouchableOpacity onPress={removeImage} style={styles.removeImageBtn}>
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitText}>Submit Request</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { marginBottom: 40 }]}
            onPress={() => setViewingRequests(true)}
          >
            <Text style={styles.secondaryText}>View My Requests</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
  label: {
    marginTop: 10,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
  },
  textArea: {
    height: 100,
  },
  trackContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 10,
  },
  trackButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  trackButtonSelected: {
    backgroundColor: "#007bff22",
    borderColor: "#007bff",
  },
  trackText: {
    color: "#333",
  },
  trackTextSelected: {
    color: "#007bff",
  },
  imageButton: {
    backgroundColor: "#f2f2f2",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  imageButtonText: {
    color: "#333",
  },
  imagePreviewContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  preview: {
    width: "100%",
    height: 180,
    borderRadius: 10,
  },
  removeImageBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#ff4444",
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButton: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  submitText: {
    color: "#fff",
    fontWeight: "bold",
  },
  secondaryButton: {
    marginTop: 15,
    alignItems: "center",
  },
  secondaryText: {
    color: "#007bff",
    fontWeight: "500",
  },
  errorInput: {
    borderColor: "#ff4444",
  },
  errorText: {
    color: "#ff4444",
    fontSize: 13,
    marginTop: 4,
  },
  requestCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  requestTitle: {
    fontWeight: "bold",
    fontSize: 16,
  },
  requestName: {
    fontSize: 14,
    marginTop: 3,
  },
  requestTime: {
    color: "#777",
    fontSize: 12,
  },
  requestDesc: {
    marginTop: 8,
    fontSize: 14,
  },
  requestImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginTop: 10,
  },
  statusChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusText: {
    color: "#333",
    fontWeight: "600",
    fontSize: 12,
  },
});