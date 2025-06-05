const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  titulo: String,
  descripcion: String,
  fecha: Date,
  prioridad: { type: String, enum: ["alta", "media", "baja"] },
  estado: { type: String, enum: ["pendiente", "completada"], default: "pendiente" }
});

module.exports = mongoose.model("Task", TaskSchema);
