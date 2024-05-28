// Importa la librería tmi.js para la interacción con Twitch
const tmi = require('tmi.js'); 
// Importa la librería dotenv para manejar variables de entorno
const dotenv = require('dotenv'); 
// Carga las variables de entorno desde el archivo .env
dotenv.config(); 

// Configuración del cliente
const config = {
    options: {
    // Muestra mensajes de depuración en la consola (puedes cambiar a false para desactivar)
      debug: true, 
    },
    connection: {
    // Reconecta automáticamente si se pierde la conexión
      reconnect: true, 
      // Usa una conexión segura (https)
      secure: true, 
    },
    identity: {
    // Nombre de usuario del bot
      username: '',
    // Token de OAuth del bot 
      password: process.env.OAUTH 
    },
    channels: [
    // Lista de canales a los que se conectará el bot
      ''
    ]
};

// Crear un cliente de TMI.js
const client = new tmi.Client(config);
const usuariosAutorizados = ['usuario1', 'usuario2', 'usuario3'];
const palabras = [
    { palabra: 'javascript', descripcion: 'Un lenguaje de programación utilizado principalmente para crear contenido web interactivo.' },
    { palabra: 'twitch', descripcion: 'Una plataforma de streaming' },
    { palabra: 'ahorcado', descripcion: 'Un juego en el que los jugadores intentan adivinar una palabra.' },
];
// Conectar el cliente al servidor de Twitch
client.connect();


// La palabra que se debe adivinar
let palabraSecreta = ''; 
// La palabra con las letras no adivinadas ocultas con guiones bajos
let palabraOculta = ''; 
// Número de intentos permitidos
let intentos = 6; 
// Lista de letras ya adivinadas
let letrasUsadas = []; 
//Dar pista
let pistaDada = false;

// Función para iniciar un nuevo juego
function iniciarJuego(channel) {
    const seleccion = palabras[Math.floor(Math.random() * palabras.length)];
    palabraSecreta = seleccion.palabra;
    palabraOculta = '_'.repeat(palabraSecreta.length);
    intentos = 6;
    letrasUsadas = [];
    pistaDada = false;

    // Dar pista al inicio del juego
    darPista(channel, seleccion.descripcion);
}
function darPista(channel, descripcion) {
    client.say(channel, `Pista: ${descripcion}`);
    pistaDada = true;
}
// Función para adivinar una letra
function adivinarLetra(letra) {
// Verifica si la letra ya se usó o si no es una letra única
  if (letrasUsadas.includes(letra) || letra.length !== 1) { 
    return; 
  }
// Agrega la letra a la lista de letras usadas
  letrasUsadas.push(letra); 
// Verifica si la letra está en la palabra secreta
  if (palabraSecreta.includes(letra)) { 
// Variable para construir la nueva palabra oculta
    let nuevaPalabraOculta = ''; 

    for (let i = 0; i < palabraSecreta.length; i++) {
    // Si la letra coincide con la letra en la palabra secreta
      if (palabraSecreta[i] === letra) { 
    // Agrega la letra adivinada a la nueva palabra oculta
        nuevaPalabraOculta += letra; 
      } else {
    // Mantiene el guion bajo o letra previamente adivinada
        nuevaPalabraOculta += palabraOculta[i]; 
      }
    }
// Actualiza la palabra oculta
    palabraOculta = nuevaPalabraOculta; 
  } else {
// Reduce el número de intentos si la letra no está en la palabra secreta
    intentos--; 
  }
}

// Función para adivinar la palabra completa
function adivinarPalabra(palabra) {
// Verifica si la palabra adivinada es correcta
  if (palabra === palabraSecreta) { 
// Si es correcta, descubre toda la palabra
    palabraOculta = palabraSecreta; 
  } else {
// Si es incorrecta, reduce el número de intentos
    intentos--; 
  }
}

// Maneja los mensajes recibidos en el chat
client.on('message', (channel, tags, message, self) => {
// Ignora los mensajes del propio bot
  if (self) return; 
// Divide el mensaje en palabras
  const args = message.split(' '); 
// Toma el primer elemento como el comando y lo convierte a minúsculas
  const command = args.shift().toLowerCase(); 
  if (command === '!start') {
    // Verificar si el usuario está en la lista de usuarios autorizados
    if (usuariosAutorizados.includes(tags.username)) {
        // Iniciar un nuevo juego
        iniciarJuego(channel);
        // Enviar un mensaje al chat con la palabra oculta
        client.say(channel, `Juego de Ahorcado iniciado. Palabra: ${palabraOculta}`);
    } else{
        client.say(channel, `No tienes permiso para empezar el juego`);

    }
}
// Comando para verificar el estado del juego
  if (command === '!guess') { 
// Si no hay un juego en curso
    if (palabraSecreta === '') { 
    // Informa al usuario que no hay juego en curso
      client.say(channel, 'No hay ningún juego en curso. Usa !start para comenzar un nuevo juego.'); 
    // Si hay un juego en curso
    } else { 
    // Envía el estado del juego al chat
      client.say(channel, `Juego en curso. Palabra: ${palabraOculta} | Intentos restantes: ${intentos} | Letras usadas: ${letrasUsadas.join(', ')}`); 
    }
  }
// Comando para adivinar una letra
  if (command === '!letra') { 
// Si no hay un juego en curso
    if (palabraSecreta === '') {
     // Informa al usuario que no hay juego en curso 
      client.say(channel, 'No hay ningún juego en curso. Usa !start para comenzar un nuevo juego.'); 
      return;
    }
// Si no se proporciona una letra
    if (args.length === 0) { 
    // Pide al usuario que proporcione una letra
      client.say(channel, 'Por favor, proporciona una letra para adivinar.'); 
      return;
    }
// Toma la letra proporcionada y la convierte a minúsculas
    const letra = args[0].toLowerCase();
    // Llama a la función para adivinar la letra 
    adivinarLetra(letra); 
// Si la palabra ha sido completamente adivinada
    if (palabraOculta === palabraSecreta) {
    // Felicita al usuario 
      client.say(channel, `¡Felicidades! Has adivinado la palabra: ${palabraSecreta}`); 
    // Resetea la palabra secreta
      palabraSecreta = '';
    // Si se han agotado los intentos 
    } else if (intentos <= 0) { 
    // Informa al usuario que ha perdido
      client.say(channel, `¡Lo siento! Has perdido. La palabra era: ${palabraSecreta}`);
    // Resetea la palabra secreta 
      palabraSecreta = '';
    // Si el juego continúa 
    } else { 
    // Envía el estado del juego al chat
      client.say(channel, `Palabra: ${palabraOculta} | Intentos restantes: ${intentos} | Letras usadas: ${letrasUsadas.join(', ')}`); 
    }
  }
// Comando para adivinar la palabra completa
  if (command === '!adivinar') { 
// Si no hay un juego en curso
    if (palabraSecreta === '') { 
    // Informa al usuario que no hay juego en curso
      client.say(channel, 'No hay ningún juego en curso. Usa !start para comenzar un nuevo juego.'); 
      return;
    }
// Si no se proporciona una palabra
    if (args.length === 0) { 
        // Pide al usuario que proporcione una palabra
      client.say(channel, 'Por favor, proporciona una palabra para adivinar.'); 
      return;
    }
// Toma la palabra proporcionada y la convierte a minúsculas
    const palabra = args.join(' ').toLowerCase(); 
// Llama a la función para adivinar la palabra
    adivinarPalabra(palabra); 
// Si la palabra ha sido completamente adivinada
    if (palabraOculta === palabraSecreta) { 
// Felicita al usuario
      client.say(channel, `¡Felicidades! Has adivinado la palabra completa: ${palabraSecreta}`); 
// Resetea la palabra secreta 
      palabraSecreta = ''; 
// Si se han agotado los intentos
    } else if (intentos <= 0) { 
// Informa al usuario que ha perdido
      client.say(channel, `¡Lo siento! Has perdido. La palabra era: ${palabraSecreta}`);
// Resetea la palabra secreta
      palabraSecreta = ''; 
// Si el juego continúa
    } else { 
// Envía el estado del juego al chat
      client.say(channel, `Palabra: ${palabraOculta} | Intentos restantes: ${intentos} | Letras usadas: ${letrasUsadas.join(', ')}`); 
    }
  }
});
