const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  usuario_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true
  },
  titulo: { 
    type: String, 
    required: true 
  },
  descripcion: { 
    type: String 
  },
  fecha: { 
    type: Date, 
    default: Date.now 
  },
  prioridad: { 
    type: String, 
    enum: ["alta", "media", "baja"],
    default: "media"
  },
  estado: { 
    type: String, 
    enum: ["pendiente", "completada"], 
    default: "pendiente" 
  },
  
  imagen_key: {
    type: String,
    default: null
  },
  imagen_metadata: {
    originalName: {
      type: String,
      default: null
    },
    mimeType: {
      type: String,
      default: null
    },
    size: {
      type: Number,
      default: null
    },
    uploadedAt: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Task", TaskSchema);