import { v2 as cloudinary } from "cloudinary";

// export const deleteImageFromCloudinary = async (publicId: string) => {
//   try {
//     const result = await cloudinary.uploader.destroy(publicId);
//     console.log("Deleted:", result);
//     return result;
//   } catch (error) {
//     console.error("Error during file delete:", error);
//     throw error;
//   }
// };

export const deleteImageFromCloudinary = async (
  publicIds: string | string[]
) => {
  try {
    if (Array.isArray(publicIds)) {
      // Briše više fajlova odjednom
      const result = await cloudinary.api.delete_resources(publicIds);
      console.log("Deleted multiple files:", result);
      return result;
    } else {
      // Briše jedan fajl
      const result = await cloudinary.uploader.destroy(publicIds);
      console.log("Deleted single file:", result);
      return result;
    }
  } catch (error) {
    console.error("Error during file delete:", error);
    throw error;
  }
};
