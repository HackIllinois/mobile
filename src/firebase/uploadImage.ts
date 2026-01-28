import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./firebaseConfig";
import * as FileSystem from "expo-file-system";



export async function uploadImageAsync(uri: string | null) {
  if (!uri) return null;

  console.log("Firebase Storage disabled (Spark plan) — using placeholder image instead.");
  return "https://placehold.co/400x300?text=Uploaded+Image";
}

// export async function uploadImageAsync(uri) {
//   if (!uri) return null;
//   const response = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
//   const blob = Buffer.from(response, "base64");
//   const filename = `support_images/${Date.now()}.jpg`;
//   const storageRef = ref(storage, filename);
//   await uploadBytes(storageRef, blob);
//   const downloadURL = await getDownloadURL(storageRef);
//   return downloadURL;
// }