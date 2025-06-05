const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const cors = require("cors");

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", authRoutes);
app.use("/api/tareas", taskRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 API corriendo en http://localhost:${PORT}`));
