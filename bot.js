const tmi = require('tmi.js');

// Array para almacenar la lista de usuarios con turno
const listaTurnos = [];
// Lista de roles permitidos para vaciar, finalizar o fin turnos
const rolesPermitidos = ['mod'];

// Configuración del bot y del canal
const config = {
  identity: {
    username: 'user',
    password: 'oauth:code', // Puedes obtener este token desde https://twitchapps.com/tmi/
  },
  channels: ['streamers'],
};

// Inicializar el cliente de Twitch
const client = new tmi.Client(config);

// Conectar el cliente al canal
client.connect();

// Manejar eventos de chat
client.on('message', (channel, tags, message, self) => {
  if (self) return; // Ignorar mensajes propios del bot

  // Parsear el comando y ejecutar la acción correspondiente
  const comando = message.toLowerCase(); // Convertir el comando a minúsculas
  if (comando.startsWith('!turno')) {
    // Obtener el argumento del comando (por ejemplo, !turno nombre)
    const usuario = message.split(' ')[1];
    ponerEnTurno(channel, tags.username, usuario);
  } else if (comando.startsWith('!fin')) {
    // Obtener el argumento del comando (por ejemplo, !fin nombre o !fin 4)
    const argumento = message.split(' ')[1];
    finalizarPrimerosUsuarios(channel, argumento, tags);
  } else if (comando === '!lista') {
    mostrarLista(channel);
  } else if (comando === '!vaciar') {
    // Verificar si el usuario tiene permisos para vaciar la lista
    if (tienePermisos(tags)) {
      vaciarLista();
      client.say(channel, 'La lista de turnos ha sido vaciada.');
    } else {
      client.say(channel, 'No tienes permisos para vaciar la lista de turnos.');
    }
  }
});

// Función para agregar un usuario a la lista de turnos
function ponerEnTurno(channel, solicitante, usuario) {
  const nombreUsuario = usuario || solicitante; // Si no se proporciona usuario, usar el solicitante
  if (!listaTurnos.includes(nombreUsuario)) {
    // Agregar el usuario solo si no está en la lista
    listaTurnos.push(nombreUsuario);
    client.say(channel, `¡${nombreUsuario} ha sido agregado a la lista de turnos!`);
  } else {
    client.say(channel, `${nombreUsuario} ya está en la lista de turnos.`);
  }
}

// Función para mostrar la lista de turnos
function mostrarLista(channel) {
  if (listaTurnos.length > 0) {
    const listaString = listaTurnos.join(', ');
    client.say(channel, `Lista de turnos actual: ${listaString}`);
  } else {
    client.say(channel, 'La lista de turnos está vacía.');
  }
}

// Función para finalizar un número específico de usuarios desde el principio de la lista
function finalizarPrimerosUsuarios(channel, argumento, tags) {
  if (!tienePermisos(tags)) {
    client.say(channel, 'No tienes permisos para finalizar turnos.');
    return;
  }

  if (argumento && !isNaN(argumento)) {
    // Si el argumento es un número, finalizar esa cantidad de usuarios
    const cantidad = parseInt(argumento, 10);
    if (listaTurnos.length >= cantidad) {
      const usuariosFinalizados = listaTurnos.splice(0, cantidad);
      const usuariosFinalizadosString = usuariosFinalizados.join(', ');
      client.say(channel, `¡Se han finalizado los turnos de: ${usuariosFinalizadosString}!`);
    } else {
      client.say(channel, 'No hay suficientes usuarios en la lista de turnos.');
    }
  } else {
    client.say(channel, 'Por favor, proporciona un número válido para finalizar turnos.');
  }
}

// Función para vaciar la lista de turnos
function vaciarLista() {
  listaTurnos.length = 0;
}

// Función para verificar si el usuario tiene permisos de mod
function tienePermisos(tags) {
  const usuario = tags.username.toLowerCase();
  return rolesPermitidos.some((rol) => tags['user-type'] === rol || usuario === 'user');
}
