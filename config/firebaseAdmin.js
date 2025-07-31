const admin = require("firebase-admin");

let serviceAccount;

// Condición para el despliegue vs. desarrollo local
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    console.log("✅ Cargando credenciales de Firebase desde variable de entorno.");
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } catch (e) {
    console.error("❌ Error fatal: No se pudo parsear el JSON de la variable de entorno FIREBASE_SERVICE_ACCOUNT_JSON.", e);
    process.exit(1);
  }
} else {
  try {
    console.log("✅ Cargando credenciales de Firebase desde archivo local (firebase-service-account.json).");
    serviceAccount = require("./firebase-service-account.json");
  } catch (e) {
    console.error("❌ Error fatal: No se encontró el archivo './firebase-service-account.json' ni la variable de entorno.");
    console.log("Asegúrate de tener el archivo de credenciales en la carpeta 'config' o de configurar la variable de entorno en tu servidor.");
    process.exit(1);
  }
}

// Inicializa Firebase Admin SDK con las credenciales cargadas
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("✅ Firebase Admin SDK inicializado correctamente.");
} catch (error) {
  console.error("❌ Error inicializando Firebase Admin SDK:", error);
}

module.exports = admin;