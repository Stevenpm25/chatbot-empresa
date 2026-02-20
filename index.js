const express = require('express');
const axios = require('axios');
const app = express();
const respuestas = require('./respuestas.json');

app.use(express.json());

// ✅ 1. TOKEN LARGO DE FACEBOOK
const PAGE_ACCESS_TOKEN = "EAAX3QnCnj44BQ0ggD84NGNP269zeaiApTFcjDwRxH8dFN9MWJZBT9cB4P7IxFz89t3CHVzaNr1i3fFXf0p2ywMr9BJpg9RfXJfdmAnzZCrFZCHZCKlD3d4WF5AWdukoEWiA7Awwicsn3X6NtSKhkO1TzQZA9Y3GiBjKHqQaU0V3lxEDlfftcH7I9Pt1jZBYL7b8BZBTDKJcAQZDZD";

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

// --- LÓGICA DEL BOT (ACTUALIZADA PARA SER PRUDENTE) ---
function manejarMensaje(sender_psid, mensajeRecibido) {
    let textoUsuario = mensajeRecibido.toLowerCase();
    let respuestaBot = ""; 
    let encontrado = false;

    // 1. Si el cliente saluda, le damos la bienvenida
    if (textoUsuario === "hola" || textoUsuario === "buenas" || textoUsuario === "buenos dias" || textoUsuario === "buenas tardes") {
        respuestaBot = respuestas.mensajes_sistema.bienvenida;
        encontrado = true;
    }

    // 2. Buscar en los productos
    respuestas.productos.forEach(categoria => {
        categoria.items.forEach(item => {
            if (item.keywords.some(key => textoUsuario.includes(key.toLowerCase()))) {
                respuestaBot = item.respuesta;
                encontrado = true;
            }
        });
    });

    // 3. Buscar ubicación específica si no ha encontrado producto y no es un saludo simple
    if (!encontrado && (textoUsuario.includes("donde") || textoUsuario.includes("ubicacion"))) {
        respuestaBot = respuestas.mensajes_sistema.ubicacion_campin;
        encontrado = true;
    }

    // 4. SI NO ENCUENTRA NADA, SE QUEDA CALLADO (No interrumpe)
    if (!encontrado) {
        console.log(`🤫 Silencio. El cliente dijo algo fuera del libreto: "${textoUsuario}"`);
        return; // Esto detiene al bot y no envía ningún mensaje
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

// --- INICIO DEL SERVIDOR ---
const PORT = process.env.PORT || 10000; 
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor abierto y escuchando en puerto ${PORT}`);
});

