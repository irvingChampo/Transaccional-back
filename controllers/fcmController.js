const User = require("../models/User");
const admin = require("../config/firebaseAdmin"); // Importamos el admin de Firebase que configuraremos

/**
 * Registra un token de FCM y lo asocia con el usuario autenticado.
 */
exports.registerDevice = async (req, res) => {
  const { fcmToken } = req.body;
  const userId = req.user.id; // Obtenemos el ID del usuario desde el token JWT

  if (!fcmToken) {
    return res.status(400).json({ mensaje: "El fcmToken es requerido." });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ mensaje: "Usuario no encontrado." });
    }

    // Añadimos el token al array del usuario solo si no existe ya
    if (!user.fcmTokens.includes(fcmToken)) {
      user.fcmTokens.push(fcmToken);
      await user.save();
    }

    res.status(200).json({ mensaje: "Dispositivo registrado exitosamente." });
  } catch (error) {
    console.error("Error registrando dispositivo:", error);
    res.status(500).json({ mensaje: "Error del servidor." });
  }
};

/**
 * Envía una notificación a todos los usuarios que tengan al menos un token FCM registrado.
 */
exports.sendNotificationToAll = async (req, res) => {
    const { title, message } = req.body;

    if (!title || !message) {
        return res.status(400).json({ mensaje: "El título y el mensaje son requeridos." });
    }

    try {
        const usersWithTokens = await User.find({ fcmTokens: { $exists: true, $ne: [] } });
        const allTokens = usersWithTokens.flatMap(user => user.fcmTokens);

        if (allTokens.length === 0) {
            return res.status(200).json({ mensaje: "No hay dispositivos registrados para notificar." });
        }

        const payload = {
            notification: {
                title: title,
                body: message,
            },
            tokens: allTokens,
        };

        console.log(`Enviando notificación a ${allTokens.length} dispositivos.`);
        const response = await admin.messaging().sendEachForMulticast(payload);
        
        const successCount = response.successCount;
        const failureCount = response.failureCount;

        console.log(`Notificaciones enviadas: ${successCount} con éxito, ${failureCount} fallidas.`);

        if (failureCount > 0) {
            const tokensToDelete = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const error = resp.error.code;
                    if (error === 'messaging/registration-token-not-registered') {
                        tokensToDelete.push(allTokens[idx]);
                    }
                }
            });
            
            if (tokensToDelete.length > 0) {
                await User.updateMany(
                    { fcmTokens: { $in: tokensToDelete } },
                    { $pull: { fcmTokens: { $in: tokensToDelete } } }
                );
                console.log(`Se limpiaron ${tokensToDelete.length} tokens inválidos.`);
            }
        }

        res.status(200).json({ 
            mensaje: `Notificación enviada. Éxitos: ${successCount}, Fallos: ${failureCount}` 
        });

    } catch (error) {
        console.error("Error enviando notificación a todos:", error);
        res.status(500).json({ mensaje: "Error del servidor al enviar la notificación." });
    }
};