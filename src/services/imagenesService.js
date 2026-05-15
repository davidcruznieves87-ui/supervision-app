import imageCompression from "browser-image-compression";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

const storage = getStorage();

export const subirImagenOptimizada =
  async (file, carpeta = "supervisiones") => {

    try {

      // 🔥 COMPRESIÓN
      const opciones = {
        maxSizeMB: 0.15,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        fileType: "image/webp",
      };

      const archivoComprimido =
        await imageCompression(
          file,
          opciones
        );

      // 🔥 NOMBRE ÚNICO
      const nombre =
        `${Date.now()}-${Math.random()}.webp`;

      // 🔥 REFERENCIA STORAGE
      const storageRef = ref(
        storage,
        `${carpeta}/${nombre}`
      );

      // 🔥 SUBIR
      await uploadBytes(
        storageRef,
        archivoComprimido
      );

      // 🔥 OBTENER URL
      const url =
        await getDownloadURL(storageRef);

      return url;

    } catch (error) {

      console.error(
        "Error subiendo imagen:",
        error
      );

      throw error;
    }
};