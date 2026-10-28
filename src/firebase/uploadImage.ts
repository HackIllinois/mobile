export async function uploadImageAsync(uri: string | null) {
  if (!uri) return null;

  console.log("Firebase Storage disabled (Spark plan) — using placeholder image instead.");
  return "https://placehold.co/400x300?text=Uploaded+Image";
}
