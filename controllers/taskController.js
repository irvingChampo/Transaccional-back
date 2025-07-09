const Task = require("../models/Task");
const ImageService = require("../service/imagenS3");

exports.getTareas = async (req, res) => {
  try {
    const tareas = await Task.find({ usuario_id: req.user.id });

    const tareasConImagenes = tareas.map(tarea => ({
      ...tarea.toObject(),
      imagen_url: tarea.imagen_key ? ImageService.generateImageUrl(tarea.imagen_key) : null
    }));

    res.json(tareasConImagenes);
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    res.status(500).json({ 
      success: false, 
      mensaje: "Error del servidor" 
    });
  }
};

exports.getTareaById = async (req, res) => {
  try {
    const tarea = await Task.findOne({
      _id: req.params.id,
      usuario_id: req.user.id
    });

    if (!tarea) {
      return res.status(404).json({
        success: false,
        mensaje: "Tarea no encontrada"
      });
    }

    const tareaConImagen = {
      ...tarea.toObject(),
      imagen_url: tarea.imagen_key ? ImageService.generateImageUrl(tarea.imagen_key) : null
    };

    res.json({
      success: true,
      tarea: tareaConImagen
    });

  } catch (error) {
    console.error("Error al obtener tarea:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error del servidor"
    });
  }
};

exports.crearTarea = async (req, res) => {
  try {
    const { base64Image, ...datosTarea } = req.body;
    
    const nuevaTarea = {
      ...datosTarea,
      usuario_id: req.user.id
    };
    
    let uploadResult = null;
    
    if (req.file) {
      uploadResult = await ImageService.uploadImage(req.file);
      
      if (!uploadResult.success) {
        return res.status(400).json({
          success: false,
          mensaje: "Error al subir la imagen",
          error: uploadResult.error
        });
      }
    }
    else if (base64Image) {
      const isValid = ImageService.isValidBase64Image(base64Image);
      
      if (isValid) {
        uploadResult = await ImageService.uploadBase64Image(base64Image);
        
        if (!uploadResult.success) {
          return res.status(400).json({
            success: false,
            mensaje: "Error al subir la imagen base64",
            error: uploadResult.error
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          mensaje: "Formato de imagen base64 inválido"
        });
      }
    }
    
    if (uploadResult && uploadResult.success) {
      nuevaTarea.imagen_key = uploadResult.imageKey;
      nuevaTarea.imagen_metadata = {
        originalName: req.file ? req.file.originalname : 'base64-image',
        mimeType: req.file ? req.file.mimetype : base64Image.split(';')[0].split(':')[1],
        size: req.file ? req.file.size : Buffer.from(base64Image.split(',')[1], 'base64').length,
        uploadedAt: new Date()
      };
    }
    
    const tarea = new Task(nuevaTarea);
    await tarea.save();
    
    const tareaConImagen = {
      ...tarea.toObject(),
      imagen_url: tarea.imagen_key ? ImageService.generateImageUrl(tarea.imagen_key) : null
    };
    
    res.status(201).json({
      success: true,
      mensaje: "Tarea creada exitosamente",
      tarea: tareaConImagen
    });
    
  } catch (error) {
    console.error('Error en crearTarea:', error);
    res.status(500).json({
      success: false,
      mensaje: "Error del servidor",
      error: error.message
    });
  }
};

exports.actualizarTarea = async (req, res) => {
  try {
    const { base64Image, eliminarImagen, ...datosTarea } = req.body;

    const tareaExistente = await Task.findOne({
      _id: req.params.id,
      usuario_id: req.user.id
    });

    if (!tareaExistente) {
      return res.status(404).json({
        success: false,
        mensaje: "Tarea no encontrada"
      });
    }

    let datosActualizar = { ...datosTarea };
    let imagenAnterior = tareaExistente.imagen_key;

    if (eliminarImagen === true || eliminarImagen === "true") {
      if (imagenAnterior) {
        await ImageService.deleteImage(imagenAnterior);
      }

      datosActualizar.imagen_key = null;
      datosActualizar.imagen_metadata = null;
    } 
    else if (req.file || (base64Image && ImageService.isValidBase64Image(base64Image))) {
      let uploadResult = null;

      if (req.file) {
        uploadResult = await ImageService.uploadImage(req.file);
      } else if (base64Image) {
        uploadResult = await ImageService.uploadBase64Image(base64Image);
      }

      if (!uploadResult.success) {
        return res.status(400).json({
          success: false,
          mensaje: "Error al subir la nueva imagen",
          error: uploadResult.error
        });
      }

      if (imagenAnterior) {
        await ImageService.deleteImage(imagenAnterior);
      }

      datosActualizar.imagen_key = uploadResult.imageKey;
      datosActualizar.imagen_metadata = {
        originalName: req.file ? req.file.originalname : 'base64-image',
        mimeType: req.file ? req.file.mimetype : base64Image.split(';')[0].split(':')[1],
        size: req.file ? req.file.size : Buffer.from(base64Image.split(',')[1], 'base64').length,
        uploadedAt: new Date()
      };
    }

    const tarea = await Task.findOneAndUpdate(
      { _id: req.params.id, usuario_id: req.user.id },
      datosActualizar,
      { new: true }
    );

    const tareaConImagen = {
      ...tarea.toObject(),
      imagen_url: tarea.imagen_key ? ImageService.generateImageUrl(tarea.imagen_key) : null
    };

    res.json({
      success: true,
      mensaje: "Tarea actualizada correctamente",
      tarea: tareaConImagen
    });

  } catch (error) {
    console.error("Error al actualizar tarea:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error del servidor",
      error: error.message
    });
  }
};

exports.eliminarTarea = async (req, res) => {
  try {
    const tarea = await Task.findOneAndDelete({
      _id: req.params.id,
      usuario_id: req.user.id
    });

    if (!tarea) {
      return res.status(404).json({
        success: false,
        mensaje: "Tarea no encontrada"
      });
    }

    if (tarea.imagen_key) {
      await ImageService.deleteImage(tarea.imagen_key);
    }

    res.json({
      success: true,
      mensaje: "Tarea eliminada correctamente"
    });

  } catch (error) {
    console.error("Error al eliminar tarea:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error del servidor",
      error: error.message
    });
  }
};