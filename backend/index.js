const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');

// Asegúrate de que tu archivo database.js exporte la conexión (el pool)
const pool = require('./database'); 

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const jwtSecret = process.env.JWT_SECRET || 'clave_secreta_de_desarrollo_insegura_cambiala'; 

const allowedOrigins =[
    'http://localhost:5173',
    'http://192.168.56.1:5173',
    'http://192.168.1.71:5173',
    'http://192.168.0.29:5173',
    'http://192.168.0.133:5173',
    'http://192.168.0.117:5173',
    'http://192.168.1.122:5173',
    'https://consultorio-frontend.onrender.com'
];

app.use(cors({
    origin: function (origin, callback){
        if (!origin || allowedOrigins.indexOf(origin) !== -1){
            callback(null, true);
        }else{
            callback(new Error('Origen, no permitido por CORS'));
        }
    }
}));
app.use(express.json()); 

// =========================================================================
// RUTA DE REGISTRO (Usuario) - 🛠️ CORRECCIÓN DE LOG
// =========================================================================
app.post('/api/register', async (req, res) => {
    try {
        const { nombre, email, cedu, telefono, password } = req.body; 
        
        const salt = await bcrypt.genSalt(10); 
        const contrasenaHasheada = await bcrypt.hash(password, salt); 

        const nuevoUsuario = await pool.query(
            "INSERT INTO usuario (nombre, email, cedu, telefono, contraseña) VALUES ($1, $2, $3, $4, $5) RETURNING usuario_id, nombre, email",
            [nombre, email, cedu, telefono, contrasenaHasheada] 
        );
        const usuarioCreado = nuevoUsuario.rows[0];
        res.status(201).json({ message: "Usuario registrado con éxito.", user: usuarioCreado });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ error: "El email o la cédula ya están registrados." });
        }
        
        // 🚨 CAMBIO DE LOG: Imprimimos el objeto de error completo
        console.error("--- ERROR FATAL DE REGISTRO ---", err); 
        console.error("MENSAJE SQL:", err.message);
        // ----------------------------------------------
        
        res.status(500).json({ error: "Error interno del servidor durante el registro." });
    }
});

// =========================================================================
// RUTA DE REGISTRO (Paciente)
// =========================================================================
app.post('/api/pacientes/registrar', async (req, res) => {
    try {
        const { 
            no_expediente, 
            nombre_paciente,
            fecha_nacimiento, 
            edad,
            direccion, 
            telefono,
            nombre_familiar, 
            telefono_familiar, 
            genero, 
            embarazo, 
            sangineo, 
            ocupacion, 
            escuela, 
            estado_civil, 
            usuario_id
        } = req.body;
        
        const nuevoPaciente = await pool.query(
            `INSERT INTO paciente (
                usuario_id, no_expediente, nombre_paciente, telefono, fecha_nacimiento, 
                edad, direccion, nombre_familiar, telefono_familiar, genero, embarazo, 
                sangineo, ocupacion, escuela, estado_civil
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             RETURNING paciente_id, nombre_paciente`,
            [
                usuario_id,         
                no_expediente,      
                nombre_paciente,    
                telefono,           
                fecha_nacimiento,   
                edad,               
                direccion,          
                nombre_familiar,    
                telefono_familiar,  
                genero,             
                embarazo,           
                sangineo,           
                ocupacion,          
                escuela,            
                estado_civil        
            ]
        );
        
        const pacienteCreado = nuevoPaciente.rows[0];
        
        res.status(201).json({ 
            message: "Paciente registrado con éxito.", 
            paciente: pacienteCreado 
        });

    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ error: "El número de expediente ya está registrado." });
        }
        console.error("Error en /api/pacientes/registrar:", err.message); 
        res.status(500).json({ error: "Error interno del servidor al registrar el paciente." });
    }
});


// =========================================================================
// RUTA DE LOGIN - 🛠️ CORRECCIÓN DE LOG
// =========================================================================
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const userResult = await pool.query(
            "SELECT usuario_id, nombre, email, contraseña FROM usuario WHERE email = $1", 
            [email]
        );
        const user = userResult.rows[0];
        if (!user) return res.status(400).json({ error: "Credenciales inválidas." });

        const isMatch = await bcrypt.compare(password, user.contraseña); 
        if (!isMatch) return res.status(400).json({ error: "Credenciales inválidas." });

        const token = jwt.sign( { id: user.usuario_id, email: user.email }, jwtSecret, { expiresIn: '1h' } );
        res.json({ token, user: { id: user.usuario_id, nombre: user.nombre, email: user.email } });
    } catch (err) {
        // 🚨 CAMBIO AQUÍ: Imprimimos el objeto de error completo para verlo en Render
        console.error("--- ERROR FATAL DE LOGIN ---", err);
        console.error("MENSAJE SQL:", err.message);
        console.error("----------------------------------");
        res.status(500).json({ error: "Error del servidor al iniciar sesión." });
    }
});


// =========================================================================
// (EL RESTO DEL CÓDIGO SE MANTIENE SIN CAMBIOS)
// =========================================================================

// ... resto del código ...

// --- Iniciar el servidor ---
app.listen(PORT, () => {
    console.log(`Backend corriendo en http://localhost:${PORT}`);
});