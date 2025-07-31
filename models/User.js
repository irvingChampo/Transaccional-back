const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  correo: { type: String, required: true, unique: true },
  contraseña: { type: String, required: true }
  // ===================== INICIO DEL CAMBIO =====================
  // Añadimos un array para guardar uno o más tokens de FCM por usuario.
  ,
  fcmTokens: {
    type: [String],
    default: []
  }
  // ===================== FIN DEL CAMBIO =====================
});

module.exports = mongoose.model("User", UserSchema);