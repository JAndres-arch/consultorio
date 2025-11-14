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

// Función de ayuda para convertir "" (string vacío) a NULL
const valorONull = (valor) => (valor === '' || valor === undefined || valor === null ? null : valor);


// =========================================================================
// RUTA DE REGISTRO (Usuario) 
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
        
        console.error("--- ERROR FATAL DE REGISTRO DE USUARIO ---", err); 
        console.error("MENSAJE SQL:", err.message);
        console.error("------------------------------------------");
        
        res.status(500).json({ error: "Error interno del servidor durante el registro." });
    }
});

// =========================================================================
// RUTA DE REGISTRO (Paciente) - 🛠️ ARREGLO DE EDAD Y FECHA
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

        // 🚨 ARREGLO CLAVE: Procesar DATE y INT para evitar el error de formato/nulo
        const fechaNacimientoProcesada = valorONull(fecha_nacimiento);
        const edadProcesada = valorONull(edad);
        
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
                fechaNacimientoProcesada, // 🚨 VALOR PROCESADO (DATE)
                edadProcesada,            // 🚨 VALOR PROCESADO (INT)
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
        
        console.error("--- ERROR FATAL DE REGISTRO DE PACIENTE ---", err); 
        console.error("MENSAJE SQL:", err.message);
        console.error("------------------------------------------");
        
        res.status(500).json({ error: "Error interno del servidor al registrar el paciente." });
    }
});


// =========================================================================
// RUTA DE LOGIN
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
        console.error("--- ERROR FATAL DE LOGIN ---", err);
        console.error("MENSAJE SQL:", err.message);
        console.error("----------------------------------");
        res.status(500).json({ error: "Error del servidor al iniciar sesión." });
    }
});


// =========================================================================
// MIDDLEWARE DE PROTECCIÓN Y RUTAS RESTANTES...
// =========================================================================
const authorize = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Acceso denegado. Se requiere autenticación.' });
    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded; 
        next(); 
    } catch (ex) {
        res.status(401).json({ error: 'Token inválido o expirado.' });
    }
};


app.get('/api/pacientes', authorize, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM paciente ORDER BY nombre_paciente ASC");
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error al obtener pacientes:", err.message);
        res.status(500).json({ error: "Error interno del servidor al obtener pacientes." });
    }
});

app.get('/api/pacientes/:id', authorize, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            "SELECT * FROM paciente WHERE paciente_id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Paciente no encontrado" });
        }
        
        res.json(result.rows[0]); 

    } catch (err) {
        console.error(`Error al obtener paciente ${req.params.id}:`, err.message);
        res.status(500).json({ error: "Error interno del servidor." });
    }
});

app.get('/api/consultas/:id', authorize, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            "SELECT * FROM consulta WHERE consulta_id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Consulta no encontrada" });
        }
        
        res.json(result.rows[0]); 

    } catch (err) {
        console.error(`Error al obtener consulta ${req.params.id}:`, err.message);
        res.status(500).json({ error: "Error interno del servidor." });
    }
});


app.delete('/api/pacientes/:id', authorize, async (req, res) => {
    const pacienteId = req.params.id;
    console.log(`[DELETE FORZOSO] Solicitud para eliminar paciente ID: ${pacienteId} y TODOS sus registros.`);
    
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        console.log(`...Borrando consultas asociadas al paciente ${pacienteId}`);
        await client.query(
            "DELETE FROM consulta WHERE paciente_id = $1", 
            [pacienteId]
        );

        console.log(`...Borrando recetas asociadas al paciente ${pacienteId}`);
        await client.query(
            "DELETE FROM receta WHERE paciente_id = $1", 
            [pacienteId]
        );

        console.log(`...Borrando al paciente ${pacienteId}`);
        const pacienteDeleteResult = await client.query(
            "DELETE FROM paciente WHERE paciente_id = $1", 
            [pacienteId]
        );
        
        if (pacienteDeleteResult.rowCount === 0) {
            throw new Error('Paciente no encontrado'); 
        }

        await client.query('COMMIT');
        
        console.log(`[DELETE FORZOSO] Éxito: Paciente ${pacienteId}, sus consultas y recetas han sido eliminados.`);
        res.json({ message: 'Paciente y todos sus registros eliminados correctamente' });
        
    } catch (error) {
        await client.query('ROLLBACK');
        
        console.error('--- ERROR 500 EN DELETE FORZOSO ---');
        console.error('Error completo:', error);
        
        if (error.message === 'Paciente no encontrado') {
            res.status(404).json({ message: 'Paciente no encontrado' });
        } else {
            res.status(500).json({ 
                message: 'Error interno del servidor. No se pudo completar la eliminación.',
                error: error.message 
            });
        }
    } finally {
        client.release();
    }
});

app.get('/api/usuario/actual', authorize, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT usuario_id, nombre, email, cedu FROM usuario WHERE usuario_id = $1", 
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Usuario del token no encontrado." });
        }
        
        res.json(result.rows[0]);

    } catch (err) {
        console.error("Error al obtener usuario actual:", err.message);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});

app.post('/api/consultas/registrar', authorize, async (req, res) => {
    const { id: usuario_id } = req.user; 
    const {
        paciente_id,
        ant_diabetes, ant_arterial, ant_tiroidales, ant_otro,
        ant_tabaquismo, ant_alcohol, ant_actividad_fisica, ant_habitos_personales,
        ant_alimentacion, ant_vivienda,
        ant_enf_infancia, ant_enf_clinicas, ant_alergicos, ant_transfusiones,
        ant_traumatismo, ant_quirurgicos, padecimiento_actual,
        sis_digestivo, sis_respiracion, sis_cardio_vascular, sis_sistema_nervioso,
        sis_genitourinario, sis_musc_esquelet, sis_endocrino, sis_piel_anexos,
        comentarios_finales,
        nota_motivo, nota_padecimiento, nota_exploracion_fisica,
        exp_peso, exp_talla, sv_temp, sv_fr, sv_ta, sv_fc, sv_spo2, sv_gluc,
        diagnostico
    } = req.body;

    // Función de ayuda para convertir "" (string vacío) a NULL
    const valorONull = (valor) => (valor === '' || valor === undefined ? null : valor);

    const sql = `
        INSERT INTO consulta (
            paciente_id, usuario_id,
            ant_diabetes, ant_arterial, ant_tiroidales, ant_otro,
            ant_tabaquismo, ant_alcohol, ant_actividad_fisica, ant_habitos_personales,
            ant_alimentacion, ant_vivienda,
            ant_enf_infancia, ant_enf_clinicas, ant_alergicos, ant_transfusiones,
            ant_traumatismo, ant_quirurgicos, padecimiento_actual,
            sis_digestivo, sis_respiracion, sis_cardio_vascular, sis_sistema_nervioso,
            sis_genitourinario, sis_musc_esquelet, sis_endocrino, sis_piel_anexos,
            comentarios_finales,
            nota_motivo, nota_padecimiento, nota_exploracion_fisica,
            exp_peso, exp_talla, sv_temp, sv_fr, sv_ta, sv_fc, sv_spo2, sv_gluc,
            diagnostico
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
            $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
            $31, $32, $33, $34, $35, $36, $37, $38, $39, $40
        ) RETURNING consulta_id
    `;
    
    // Aplicamos la función 'valorONull' a los campos numéricos.
    const values = [
        paciente_id, usuario_id,
        ant_diabetes, ant_arterial, ant_tiroidales, ant_otro,
        ant_tabaquismo, ant_alcohol, ant_actividad_fisica, ant_habitos_personales,
        ant_alimentacion, ant_vivienda,
        ant_enf_infancia, ant_enf_clinicas, ant_alergicos, ant_transfusiones,
        ant_traumatismo, ant_quirurgicos, padecimiento_actual,
        sis_digestivo, sis_respiracion, sis_cardio_vascular, sis_sistema_nervioso,
        sis_genitourinario, sis_musc_esquelet, sis_endocrino, sis_piel_anexos,
        comentarios_finales,
        nota_motivo, nota_padecimiento, nota_exploracion_fisica,
        // Campos numéricos convertidos a NULL si están vacíos
        valorONull(exp_peso), valorONull(exp_talla), valorONull(sv_temp), 
        valorONull(sv_fr), sv_ta, // sv_ta es VARCHAR(10), no necesita conversión
        valorONull(sv_fc), valorONull(sv_spo2), valorONull(sv_gluc),
        diagnostico
    ];

    try {
        const nuevaConsulta = await pool.query(sql, values);
        res.status(201).json({
            message: "¡Historia clinica guardada con éxito!",
            consulta: nuevaConsulta.rows[0]
        });
    } catch (err) {
        console.error("Error en /api/consultas/registrar:", err.message);
        res.status(500).json({ error: "Error interno del servidor al registrar la consulta." });
    }
});

app.post('/api/recetas', authorize, async (req, res) => {
    try {
        const { 
            paciente_id, 
            usuario_id, 
            consulta_id, // <-- ¡MODIFICACIÓN!
            diagnostico, 
            medicamentos, 
            indicaciones_adicionales 
        } = req.body;

        if (!paciente_id || !usuario_id || !medicamentos) {
            return res.status(400).json({ message: "Faltan datos obligatorios (paciente, usuario, medicamentos)" });
        }

        const nuevaReceta = await pool.query(
            `INSERT INTO receta (
                paciente_id, usuario_id, consulta_id, diagnostico, medicamentos, indicaciones_adicionales
              ) 
              VALUES ($1, $2, $3, $4, $5, $6)
              RETURNING receta_id`,
            [paciente_id, usuario_id, consulta_id, diagnostico, medicamentos, indicaciones_adicionales] // <-- 6 valores
        );

        res.status(201).json({ 
            message: "Receta guardada exitosamente", 
            receta_id: nuevaReceta.rows[0].receta_id 
        });

    } catch (error) {
        console.error("Error al guardar receta:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});

app.get('/apipaciente', (req, res) => {
    const sql = "SELECT paciente_id, no_expediente, fecha_nacimiento, edad FROM paciente";
    
    pool.query(sql, (err, data) =>{ 
        if (err){
            console.error("Error al consultar la base de datos:", err);
            return res.status(500).json({error: "Error interno del servidor"});
        }
        console.log("Datos de pacientes enviados al frontend.");
        return res.json(data.rows);
    });
});

// --- Iniciar el servidor ---
app.listen(PORT, () => {
    console.log(`Backend corriendo en http://localhost:${PORT}`);
});