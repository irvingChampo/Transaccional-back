const express = require("express");
const auth = require("../middlewares/authMiddleware");
const { registerDevice, sendNotificationToAll } = require("../controllers/fcmController");
const router = express.Router();

// Ruta para que la app móvil registre su token.
// Es POST y está protegida por 'auth' porque solo un usuario logueado puede registrar su dispositivo.
router.post("/register-device", auth, registerDevice);

// Ruta para que un panel de administración envíe notificaciones a todos.
// La dejaremos abierta por simplicidad, pero en un entorno de producción debería estar protegida.
router.post("/send-to-all", sendNotificationToAll);

module.exports = router;