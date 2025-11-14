// =========================================================================
// RUTA DE REGISTRO (Paciente) - 🛠️ ARREGLO DE EDAD Y FECHA
// =========================================================================
app.post('/api/pacientes/registrar', async (req, res) => {
    try {
        const { 
            no_expediente, 
            nombre_paciente,
            fecha_nacimiento, // Se envía como string
            edad,             // Se envía como string (o null)
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