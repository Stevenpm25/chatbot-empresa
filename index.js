const express = require('express');
const axios = require('axios');
const app = express();
const respuestas = require('./respuestas.json');

app.use(express.json());

// ✅ 1. PEGA AQUÍ EL TOKEN LARGO (El que empieza por EA...)
const PAGE_ACCESS_TOKEN = "EAAX3QnCnj44BQ6k5ebHE1Ue2I5E1RGUwRiHw5cA65PP4VCRtSBsvEa4v8YZCjDpnW67TeHVlNdHTMkEAZAgYZArNyZCwEPjxNH1mdZCZC93LwVaIM29tGaUzRodyM78h3YUo8MEIGQGMAodKDDINY8EGHETcfTnJNeQQtZB6C0fUxZCOMai6NdIVMDZAx1yDgzXDiZBQlL3rnr8wZDZD";

// --- VERIFICACIÓN PARA FACEBOOK ---
app.get('/webhook', (req, res) => {
    // ✅ 2. AQUÍ VA EL TOKEN CORTO (El que pusiste en el cuadro de Facebook)
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
            // Verifica que existan mensajes antes de intentar leerlos
            if (entry.messaging && entry.messaging[0]) {
                let webhook_event = entry.messaging[0];
                let sender_psid = webhook_event.sender.id;

                if (webhook_event.message && webhook_event.message.text) {
                    manejarMensaje(sender_psid, webhook_event.message.text);
                }
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

    respuestas.productos.forEach(categoria => {
        categoria.items.forEach(item => {
            if (item.keywords.some(key => textoUsuario.includes(key.toLowerCase()))) {
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
        .catch(err => {
            console.error('❌ Error al enviar:', err.response ? err.response.data : err.message);
        });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor vivo en puerto ${PORT}`));



