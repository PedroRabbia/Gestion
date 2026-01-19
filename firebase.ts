
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Reemplaza TODO este objeto con el que te da Firebase Console
// Configuración > General > Tus aplicaciones > SDK Setup
const firebaseConfig = {
  apiKey: "AIzaSyDPAE0SgLS8Ywob8FOPuuIwVOsCTCJY7_A",
  authDomain: "don-jorge-gestion.firebaseapp.com",
  projectId: "don-jorge-gestion",
  storageBucket: "don-jorge-gestion.firebasestorage.app",
  messagingSenderId: "213028524131",
  appId: "1:213028524131:web:6290c42c9a12921edf6856"
};

// Pequeña validación para avisarte si olvidaste el paso anterior
if (firebaseConfig.apiKey.includes("REEMPLAZA")) {
  console.warn("⚠️ ALERTA: No has configurado tus credenciales en firebase.ts. La app no funcionará.");
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
