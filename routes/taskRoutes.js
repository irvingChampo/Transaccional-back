const express = require("express");
const auth = require("../middlewares/authMiddleware");

let uploadTaskImage, handleUploadError;
try {
    const upMiddleware = require("../middlewares/upMiddleware");
    uploadTaskImage = upMiddleware.uploadTaskImage;
    handleUploadError = upMiddleware.handleUploadError;
} catch (error) {
    try {
        const uploadMiddleware = require("../middlewares/uploadMiddleware");
        uploadTaskImage = uploadMiddleware.uploadTaskImage;
        handleUploadError = uploadMiddleware.handleUploadError;
    } catch (fallbackError) {
        console.error('Error cargando middlewares de upload:', fallbackError.message);
    }
}

const {
  getTareas,
  getTareaById,
  crearTarea,
  actualizarTarea,
  eliminarTarea
} = require("../controllers/taskController");

const router = express.Router();

router.get("/", auth, getTareas);

router.get("/:id", auth, getTareaById);

router.post("/", 
    auth, 
    uploadTaskImage,
    handleUploadError,
    crearTarea
);

router.put("/:id", 
    auth,
    uploadTaskImage,
    handleUploadError,
    actualizarTarea
);

router.delete("/:id", auth, eliminarTarea);

module.exports = router;