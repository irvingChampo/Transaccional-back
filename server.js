const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const fcmRoutes = require("./routes/fcmRoutes"); // <-- 1. IMPORTAR LAS NUEVAS RUTAS
const cors = require("cors");
require("./config/firebaseAdmin"); // <-- AÑADIR ESTA LÍNEA PARA INICIALIZAR FIREBASE

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/fcm", fcmRoutes); // <-- 2. USAR LAS NUEVAS RUTAS

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 API corriendo en http://localhost:${PORT}`);
});