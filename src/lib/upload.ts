import { useState } from "react";
import { uploadImage } from "@/lib/store";

export function useUpload(uid: string | undefined) {
  const [uploading, setUploading] = useState(false);
  const upload = async (file: File): Promise<string> => {
    if (!uid) throw new Error("Not signed in");
    setUploading(true);
    try {
      return await uploadImage(uid, file);
    } finally {
      setUploading(false);
    }
  };
  return { upload, uploading };
}
