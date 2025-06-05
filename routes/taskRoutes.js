const express = require("express");
const auth = require("../middlewares/authMiddleware");
const {
  getTareas,
  crearTarea,
  actualizarTarea,
  eliminarTarea
} = require("../controllers/taskController");

const router = express.Router();

router.get("/", auth, getTareas);
router.post("/", auth, crearTarea);
router.put("/:id", auth, actualizarTarea);
router.delete("/:id", auth, eliminarTarea);

module.exports = router;
