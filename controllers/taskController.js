const Task = require("../models/Task");

exports.getTareas = async (req, res) => {
  const tareas = await Task.find({ usuario_id: req.user.id });
  res.json(tareas);
};

exports.crearTarea = async (req, res) => {
  const nueva = new Task({ ...req.body, usuario_id: req.user.id });
  await nueva.save();
  res.status(201).json(nueva);
};

exports.actualizarTarea = async (req, res) => {
  const tarea = await Task.findOneAndUpdate(
    { _id: req.params.id, usuario_id: req.user.id },
    req.body,
    { new: true }
  );
  if (!tarea) return res.status(404).json({ mensaje: "Tarea no encontrada" });
  res.json(tarea);
};

exports.eliminarTarea = async (req, res) => {
  const tarea = await Task.findOneAndDelete({
    _id: req.params.id,
    usuario_id: req.user.id
  });
  if (!tarea) return res.status(404).json({ mensaje: "Tarea no encontrada" });
  res.json({ mensaje: "Tarea eliminada" });
};
