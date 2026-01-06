import fs from 'fs';
import path from 'path';
// We use the exact library that is crashing your build
import Jimp from 'jimp-compact';

async function scanDirectory(directory: string) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      await scanDirectory(fullPath);
    } else if (file.toLowerCase().endsWith('.png')) {
      try {
        // Try to parse the image exactly how Expo does
        await Jimp.read(fullPath);
        process.stdout.write('.'); // Print dot for success
      } catch (err: any) {
        console.log(`\n\n❌ FOUND CORRUPTED FILE: ${fullPath}`);
        console.log(`   Error: ${err.message}\n`);
      }
    }
  }
}

console.log("Scanning ./assets for corrupted PNGs...");
scanDirectory('./assets').then(() => {
  console.log("\nScan complete.");
});