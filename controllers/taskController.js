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
    // ✅ DEBUGGING: Ver qué llega exactamente
    console.log("=== DEBUGGING ACTUALIZAR TAREA ===");
    console.log("Body completo:", JSON.stringify(req.body, null, 2));
    console.log("Estado recibido:", req.body.estado);
    console.log("Tipo de estado:", typeof req.body.estado);
    console.log("Parámetros:", req.params);
    console.log("Usuario ID:", req.user.id);

    const { base64Image, eliminarImagen, ...datosTarea } = req.body;

    // ✅ SOLUCIÓN: Filtrar campos null/undefined/vacíos
    const datosLimpios = {};
    Object.keys(datosTarea).forEach(key => {
      const valor = datosTarea[key];
      
      // Filtrar valores null, undefined, string "null", y strings vacíos
      if (valor !== null && 
          valor !== undefined && 
          valor !== 'null' && 
          valor !== '' && 
          valor !== 'undefined') {
        datosLimpios[key] = valor;
      }
    });

    console.log("Datos originales:", datosTarea);
    console.log("Datos limpios:", datosLimpios);

    // Buscar la tarea existente
    const tareaExistente = await Task.findOne({
      _id: req.params.id,
      usuario_id: req.user.id
    });

    if (!tareaExistente) {
      console.log("Tarea no encontrada:", req.params.id);
      return res.status(404).json({
        success: false,
        mensaje: "Tarea no encontrada"
      });
    }

    console.log("Tarea existente encontrada:", tareaExistente._id);

    let datosActualizar = { ...datosLimpios }; // ✅ USAR DATOS LIMPIOS
    let imagenAnterior = tareaExistente.imagen_key;

    console.log("Imagen anterior:", imagenAnterior);
    console.log("¿Eliminar imagen?", eliminarImagen);
    console.log("¿Nueva imagen base64?", !!base64Image);

    // Manejar eliminación de imagen
    if (eliminarImagen === true || eliminarImagen === "true") {
      console.log("Eliminando imagen...");
      
      if (imagenAnterior) {
        try {
          await ImageService.deleteImage(imagenAnterior);
          console.log("Imagen anterior eliminada de S3");
        } catch (deleteError) {
          console.error("Error eliminando imagen anterior:", deleteError);
          // No fallar la actualización por esto
        }
      }

      datosActualizar.imagen_key = null;
      datosActualizar.imagen_metadata = null;
      console.log("Campos de imagen establecidos a null");
    } 
    // Manejar nueva imagen
    else if (req.file || (base64Image && ImageService.isValidBase64Image(base64Image))) {
      console.log("Procesando nueva imagen...");
      
      let uploadResult = null;

      if (req.file) {
        console.log("Subiendo archivo directo...");
        uploadResult = await ImageService.uploadImage(req.file);
      } else if (base64Image) {
        console.log("Subiendo imagen base64...");
        console.log("Tamaño base64:", base64Image.length);
        
        try {
          uploadResult = await ImageService.uploadBase64Image(base64Image);
        } catch (uploadError) {
          console.error("Error detallado al subir base64:", uploadError);
          return res.status(400).json({
            success: false,
            mensaje: "Error al procesar imagen base64",
            error: uploadError.message || "Error desconocido"
          });
        }
      }

      console.log("Resultado de upload:", uploadResult);

      if (!uploadResult || !uploadResult.success) {
        console.error("Fallo en upload de imagen:", uploadResult);
        return res.status(400).json({
          success: false,
          mensaje: "Error al subir la nueva imagen",
          error: uploadResult ? uploadResult.error : "Upload result is null"
        });
      }

      // Eliminar imagen anterior si existe
      if (imagenAnterior) {
        try {
          await ImageService.deleteImage(imagenAnterior);
          console.log("Imagen anterior eliminada tras subir nueva");
        } catch (deleteError) {
          console.error("Error eliminando imagen anterior:", deleteError);
          // No fallar la actualización por esto
        }
      }

      datosActualizar.imagen_key = uploadResult.imageKey;
      datosActualizar.imagen_metadata = {
        originalName: req.file ? req.file.originalname : 'base64-image',
        mimeType: req.file ? req.file.mimetype : base64Image.split(';')[0].split(':')[1],
        size: req.file ? req.file.size : Buffer.from(base64Image.split(',')[1], 'base64').length,
        uploadedAt: new Date()
      };

      console.log("Nueva imagen configurada:", {
        imageKey: uploadResult.imageKey,
        metadata: datosActualizar.imagen_metadata
      });
    } else {
      console.log("No hay cambios en imagen");
    }

    console.log("Datos finales para actualizar:", datosActualizar);

    // ✅ ACTUALIZACIÓN SEGURA
    const tarea = await Task.findOneAndUpdate(
      { 
        _id: req.params.id, 
        usuario_id: req.user.id 
      },
      datosActualizar,
      { 
        new: true,
        runValidators: true // ✅ NUEVO: Ejecutar validaciones de Mongoose
      }
    );

    if (!tarea) {
      console.log("No se pudo actualizar la tarea");
      return res.status(404).json({
        success: false,
        mensaje: "No se pudo actualizar la tarea"
      });
    }

    console.log("Tarea actualizada exitosamente:", tarea._id);

    const tareaConImagen = {
      ...tarea.toObject(),
      imagen_url: tarea.imagen_key ? ImageService.generateImageUrl(tarea.imagen_key) : null
    };

    console.log("Respuesta final preparada");

    res.json({
      success: true,
      mensaje: "Tarea actualizada correctamente",
      tarea: tareaConImagen
    });

  } catch (error) {
    console.error("=== ERROR EN ACTUALIZAR TAREA ===");
    console.error("Tipo de error:", error.name);
    console.error("Mensaje:", error.message);
    console.error("Stack:", error.stack);
    
    // ✅ MANEJO ESPECÍFICO DE ERRORES
    if (error.name === 'ValidationError') {
      console.error("Error de validación:", error.errors);
      return res.status(400).json({
        success: false,
        mensaje: "Error de validación",
        error: error.message,
        details: error.errors
      });
    }
    
    if (error.name === 'CastError') {
      console.error("Error de formato de ID:", error);
      return res.status(400).json({
        success: false,
        mensaje: "ID de tarea inválido"
      });
    }

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