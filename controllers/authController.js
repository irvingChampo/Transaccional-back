const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { nombre, correo, contraseña } = req.body;
  try {
    const existe = await User.findOne({ correo });
    if (existe) return res.status(400).json({ mensaje: "Correo ya registrado" });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(contraseña, salt);

    const nuevoUsuario = new User({ nombre, correo, contraseña: hash });
    await nuevoUsuario.save();
    res.status(201).json({ mensaje: "Usuario registrado" });
  } catch (err) {
    res.status(500).json({ mensaje: "Error en registro" });
  }
};

exports.login = async (req, res) => {
  const { correo, contraseña } = req.body;
  try {
    const usuario = await User.findOne({ correo });
    if (!usuario) return res.status(400).json({ mensaje: "Correo no encontrado" });

    const match = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!match) return res.status(400).json({ mensaje: "Contraseña incorrecta" });

    const token = jwt.sign({ id: usuario._id }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ mensaje: "Error al iniciar sesión" });
  }
};
