import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./firebaseConfig";
import * as FileSystem from "expo-file-system";



export async function uploadImageAsync(uri) {
  return uri || "https://placehold.co/200x200?text=Image+Preview";
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