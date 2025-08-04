const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const fcmRoutes = require("./routes/fcmRoutes");
const cors = require("cors");
require("./config/firebaseAdmin");

dotenv.config();
connectDB();

const app = express();

// ===================== INICIO DEL CAMBIO IMPORTANTE =====================
// Configuración explícita de CORS para permitir cualquier origen.
// Esto solucionará el error de conexión desde tu panel web.
app.use(cors({
  origin: '*', // Permite peticiones desde cualquier página web.
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos HTTP que permitimos.
  allowedHeaders: ['Content-Type', 'Authorization'] // Encabezados que permitimos.
}));
// ===================== FIN DEL CAMBIO IMPORTANTE =====================

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/fcm", fcmRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 API corriendo en http://localhost:${PORT}`);
});