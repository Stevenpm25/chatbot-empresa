const express = require('express');
const axios = require('axios'); // Necesitamos esto para enviar mensajes
const app = express();
const respuestas = require('./respuestas.json');

app.use(express.json());

// ⚠️ PEGA AQUÍ EL TOKEN LARGO QUE GENERASTE EN FACEBOOK
const PAGE_ACCESS_TOKEN = "TU_TOKEN_LARGO_AQUI";

// --- VERIFICACIÓN PARA FACEBOOK ---
app.get('/webhook', (req, res) => {
    const VERIFY_TOKEN = "mi_token_secreto_123";
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

// --- RECEPCIÓN DE MENSAJES ---
app.post('/webhook', (req, res) => {
    let body = req.body;

    if (body.object === 'page') {
        body.entry.forEach(entry => {
            let webhook_event = entry.messaging[0];
            let sender_psid = webhook_event.sender.id; // ID del usuario que escribe

            if (webhook_event.message && webhook_event.message.text) {
                manejarMensaje(sender_psid, webhook_event.message.text);
            }
        });
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// --- LÓGICA DEL BOT ---
function manejarMensaje(sender_psid, mensajeRecibido) {
    let textoUsuario = mensajeRecibido.toLowerCase();
    let respuestaBot = respuestas.mensajes_sistema.bienvenida;
    let encontrado = false;

    // Buscar en tu JSON de productos
    respuestas.productos.forEach(categoria => {
        categoria.items.forEach(item => {
            if (item.keywords.some(key => textoUsuario.includes(key))) {
                respuestaBot = item.respuesta;
                encontrado = true;
            }
        });
    });

    if (!encontrado && (textoUsuario.includes("donde") || textoUsuario.includes("ubicacion"))) {
        respuestaBot = respuestas.mensajes_sistema.ubicacion_campin;
    }

    console.log(`📩 Mensaje de ${sender_psid}: ${textoUsuario}`);
    enviarMensaje(sender_psid, respuestaBot);
}

// --- FUNCIÓN PARA ENVIAR LA RESPUESTA ---
function enviarMensaje(sender_psid, respuesta) {
    const request_body = {
        "recipient": { "id": sender_psid },
        "message": { "text": respuesta }
    };

    axios.post(`https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, request_body)
        .then(() => console.log('📤 Mensaje enviado correctamente'))
        .catch(err => console.error('❌ Error al enviar:', err.response.data));
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor vivo en puerto ${PORT}`));
