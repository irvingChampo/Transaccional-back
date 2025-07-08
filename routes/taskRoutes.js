const express = require("express");
const multer = require("multer");
const auth = require("../middlewares/authMiddleware");
const {
  getTareas,
  getTareaById,
  crearTarea,
  actualizarTarea,
  eliminarTarea
} = require("../controllers/taskController");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'), false);
    }
  }
});

router.get("/", auth, getTareas);
router.get("/:id", auth, getTareaById);
router.post("/", auth, upload.single('imagen'), crearTarea);
router.put("/:id", auth, upload.single('imagen'), actualizarTarea);
router.delete("/:id", auth, eliminarTarea);

module.exports = router;