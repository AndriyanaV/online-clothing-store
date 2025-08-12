import fs from "fs/promises";
import path from "path";

export async function deleteVariantFolder(
  productName: string,
  colorName: string
) {
  const folderPath = path.join("uploads", "product", productName, colorName);

  try {
    // Proveri da li folder postoji
    await fs.access(folderPath);

    // Briši folder i sav sadržaj u njemu (rekurzivno)
    await fs.rm(folderPath, { recursive: true, force: true });

    console.log(`Folder obrisan: ${folderPath}`);
  } catch (err: any) {
    if (err.code === "ENOENT") {
      // Folder ne postoji, nije greška
      console.log(`Folder ne postoji: ${folderPath}`);
    } else {
      console.error(`Greška prilikom brisanja foldera:`, err);
      throw err;
    }
  }
}
