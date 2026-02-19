const express = require('express');
const app = express();
const respuestas = require('./respuestas.json'); // Aquí le decimos al código que lea el archivo anterior

app.use(express.json());

// Esta es la ruta que recibirá los mensajes de Facebook
app.post('/webhook', (req, res) => {
    // Simulamos recibir un mensaje (esto se conectará con Messenger luego)
    const mensajeUsuario = req.body.message ? req.body.message.toLowerCase() : "";
    let respuestaBot = respuestas.mensajes_sistema.bienvenida;
    let encontrado = false;

    // El Bot revisa producto por producto en el archivo JSON
    respuestas.productos.forEach(categoria => {
        categoria.items.forEach(item => {
            if (item.keywords.some(key => mensajeUsuario.includes(key))) {
                respuestaBot = item.respuesta;
                encontrado = true;
            }
        });
    });

    // Si no encontró producto, revisa si preguntaron por dirección
    if (!encontrado) {
        if (mensajeUsuario.includes("donde") || mensajeUsuario.includes("direccion")) {
            respuestaBot = respuestas.mensajes_sistema.ubicacion_campin;
        }
    }

    console.log("Usuario escribió:", mensajeUsuario);
    console.log("Bot responderá:", respuestaBot);

    res.json({ reply: respuestaBot });
});

app.listen(3000, () => console.log("✅ Bot encendido en el puerto 3000"));