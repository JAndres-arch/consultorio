import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import styles from './agregarpaciente.module.css';

// 1. URL base del backend
// 🚨 ¡AQUÍ ESTÁ LA CORRECCIÓN! 🚨
// Esta era la URL de tu FRONTEND. 
// Debes cambiarla por la URL de tu BACKEND que te da Render.
const API_BASE_URL = 'https://TU-URL-DE-BACKEND.onrender.com'; // <--- CAMBIA ESTA LÍNEA

const FormularioPaciente = () => {
    const navigate = useNavigate();
    const [message, setMessage] = useState({ text: '', type: '' });
    const [edadCalculadora, setEdadCalculadora] = useState('');

    // 2. Estado sincronizado con la BD (incluye 'telefono')
    const [regPacienteData, setRegPacienteData] = useState({
        no_expediente: '',
        nombre_paciente: '',
        fecha_nacimiento: '',
        edad: '',
        direccion: '',
        telefono: '', // <-- Corregido: Este campo SÍ existe
        nombre_familiar: '',
        telefono_familiar: '',
        genero: '',
        embarazo: '',
        sangineo: '',
        ocupacion: '',
        escuela: '',
        estado_civil: '',
        // edad: '' // Esta línea estaba duplicada, la quito
    });

    // --- Funciones de ayuda ---
    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    };

    // 3. Validación sincronizada (incluye 'telefono')
    const validateRegister = () => {
        const camposRequeridos = [
            'no_expediente', 'nombre_paciente', 'fecha_nacimiento', 'edad', 'direccion',
            'telefono', // 
            'nombre_familiar', 'telefono_familiar', 'genero',
            'sangineo', 'ocupacion', 'escuela', 'estado_civil',
            'embarazo'
        ];

        for (const campo of camposRequeridos) {
            if (campo === 'embarazo' && regPacienteData.genero !== 'Femenino') {
                continue; 
            }
            if (!regPacienteData[campo]) {
                showMessage(`Por favor llene el campo: ${campo.replace('_', ' ')}.`, "error");
                return false;
            }
        }

        const telefonoRegex = /^\d{10}$/;
        if (!telefonoRegex.test(regPacienteData.telefono.replace(/\s+/g, ''))) {
            showMessage("Introduzca un número válido de 10 dígitos para el paciente.", "error");
            return false;
        }
        if (!telefonoRegex.test(regPacienteData.telefono_familiar.replace(/\s+/g, ''))) {
            showMessage("Introduzca un número válido de 10 dígitos para el familiar.", "error");
            return false;
        }
        return true;
    };

    const handleRegisterChange = (event) => {
        const { name, value } = event.target;
        if (name === 'fecha_nacimiento') {
            const fechaNacimiento = new Date(value);
            const hoy = new Date();
            if (isNaN(fechaNacimiento.getTime())) {
                setEdadCalculadora("");
                setRegPacienteData(prevData => ({ ...prevData, fecha_nacimiento: '', edad: '' }));
                return;
            }
            if (fechaNacimiento > hoy) {
                showMessage("La fecha de nacimiento no puede ser en el futuro.", "error");
                setEdadCalculadora("");
                setRegPacienteData(prevData => ({ ...prevData, fecha_nacimiento: '', edad: '' }));
                return;
            }
            let años = hoy.getFullYear() - fechaNacimiento.getFullYear();
            let meses = hoy.getMonth() - fechaNacimiento.getMonth();
            let dias = hoy.getDate() - fechaNacimiento.getDate();
            if (dias < 0) { meses--; const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate(); dias += mesAnterior; }
            if (meses < 0) { años--; meses += 12; }
            let textoEdad = "";
            if (años > 0) {
                textoEdad = `${años} año${años > 1 ? 's' : ''}`;
                if (meses > 0) textoEdad += ` y ${meses} mes${meses > 1 ? 'es' : ''}`;
            } else if (meses > 0) {
                textoEdad = `${meses} mes${meses > 1 ? 'es' : ''}`;
                if (dias > 0) textoEdad += ` y ${dias} día${dias !== 1 ? 's' : ''}`;
            } else {
                textoEdad = `${dias} día${dias !== 1 ? 's' : ''}`;
            }
            setEdadCalculadora("Edad: " + textoEdad);
            setRegPacienteData(prevData => ({ ...prevData, fecha_nacimiento: value, edad: años, esBebe: años === 0 }));
            return; 
        }
        setRegPacienteData(prevData => {
            const newState = { ...prevData, [name]: value };
            if (name === 'genero' && value === 'Masculino') {
                newState.embarazo = '';
            }
            return newState;
        });
    };
    
    // --- Lógica de SweetAlert ---
    const mostrarMensaje = (nuevoPaciente) => {
        Swal.fire({
            title: "¿Deseas continuar con la historia clínica?",
            html: `<p>Paciente <b>${nuevoPaciente.nombre_paciente}</b> guardado con éxito.</p>`,
            icon: "success",
            showCancelButton: true,
            confirmButtonText: "Sí, ir a historia clínica",
            cancelButtonText: "No, volver al inicio"
        }).then((result) => { 
            
            // --- ¡AQUÍ ESTÁ EL CÓDIGO A CAMBIAR! ---
            if (result.isConfirmed) {
                
                // INCORRECTO:
                // navigate('/agregarcita'); 
                
                // CORRECTO:
                // Extraemos el ID y nombre del paciente que acabamos de crear
                const id = nuevoPaciente.paciente_id;
                const nombre = nuevoPaciente.nombre_paciente;
                
                // Y los pasamos en la URL
                navigate(`/agregarcita?id=${id}&nombre=${nombre}`);

            } else {
                navigate('/');
            }
        });
    };


    // 5. Lógica de Envío (¡PAYLOAD 100% SINCRONIZADO!)
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        if (!validateRegister()) return;

        const token = localStorage.getItem('token');
        const userString = localStorage.getItem('user');
        if (!token || !userString) {
            showMessage("Error: No estás autenticado. Por favor, inicia sesión de nuevo.", "error");
            navigate('/login');
            return;
        }
        const user = JSON.parse(userString); 
        
        showMessage("Enviando datos de registro...", "success");

        // CORRECCIÓN: Se envían las claves con los nombres EXACTOS de la BD
        // y se quita 'edad'
        const payload = {
            no_expediente: regPacienteData.no_expediente,
            nombre_paciente: regPacienteData.nombre_paciente,
            fecha_nacimiento: regPacienteData.fecha_nacimiento,
            edad: regPacienteData.edad,
            direccion: regPacienteData.direccion,
            telefono: regPacienteData.telefono, 
            nombre_familiar: regPacienteData.nombre_familiar,
            telefono_familiar: regPacienteData.telefono_familiar,
            genero: regPacienteData.genero,
            sangineo: regPacienteData.sangineo,
            ocupacion: regPacienteData.ocupacion,
            escuela: regPacienteData.escuela,
            estado_civil: regPacienteData.estado_civil,
            embarazo: regPacienteData.genero === 'Femenino' ? regPacienteData.embarazo : 'No aplica', 
            usuario_id: user.id
        };

        try {
            // Esta llamada AHORA SÍ FUNCIONARÁ
            const response = await fetch(`${API_BASE_URL}/api/pacientes/registrar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            
            if (response.ok) {
                setRegPacienteData({
                    no_expediente: '', nombre_paciente: '', fecha_nacimiento: '',
                    direccion: '', telefono: '', nombre_familiar: '',
                    telefono_familiar: '', genero: '', embarazo: '',
                    sangineo: '', ocupacion: '', escuela: '',
                    estado_civil: '', edad: ''
                });
                setEdadCalculadora('');
                
                mostrarMensaje(data.paciente); 
                
            } else {
                showMessage(data.error || 'Fallo en el registro.', "error");
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            // ESTE ES EL ERROR QUE ESTÁS VIENDO, porque 'response.json()'
            // falla al intentar analizar el HTML
            showMessage("Error de conexión con el servidor.", "error");
        }
    };

    useEffect(() => {
        const rootElement = document.getElementById('root');
        rootElement.classList.add('fondopaciente');
        return () => {
            rootElement.classList.remove('fondopaciente');
        };
    }, []);


    return (
        <>
            <nav className={styles.nav}>
                <div className="person">
                    <i className="bi bi-person-circle"></i>
                </div>
                <h1>Consultorio</h1>
            </nav>

            <div className={styles.contenedor}>
                {message.text && (
                    <div className={`${styles.message} ${styles[message.type]}`}>
                        {message.text}
                    </div>
                )}

                <form className={styles.formuario_paciente} onSubmit={handleRegisterSubmit}>
                    <h1>Nuevo Paciente</h1>

                    <div className={styles.grupo_expediente}>
                        <label htmlFor="no_expediente">No.Expediente</label>
                        <input id="no_expediente" className={styles.input} type="text" name="no_expediente" value={regPacienteData.no_expediente} onChange={handleRegisterChange} required />
                    </div>

                    <div className={styles.grupo_nombrepaciente}>
                        <label htmlFor="nombre_paciente">Nombre del paciente</label>
                        <input id="nombre_paciente" type="text" className={styles.input} name="nombre_paciente" value={regPacienteData.nombre_paciente} onChange={handleRegisterChange} required />
                    </div>

                    <div className={styles.grupo_fechanacimiento}>
                        <label htmlFor="fecha_nacimiento">Fecha de nacimiento</label>
                        <input id="fecha_nacimiento" type="date" className={styles.input} name="fecha_nacimiento" value={regPacienteData.fecha_nacimiento} onChange={handleRegisterChange} required />
                        <div className={styles.resultadoo}> {edadCalculadora && <span>{edadCalculadora}</span>}</div>
                    </div>

                    <div className={styles.grupo_direccion}>
                        <label htmlFor="direccion">Dirección</label>
                        <input id="direccion" type="text" className={styles.input} name="direccion" value={regPacienteData.direccion} onChange={handleRegisterChange} required />
                    </div>

                    {/* 6. JSX CORREGIDO: Añadido el campo 'telefono' de nuevo */}
                    <div className={styles.grupo_telefono}>
                        <label htmlFor="telefono">Número telefónico del paciente</label>
                        <input id="telefono" type="tel" className={styles.input} name="telefono" value={regPacienteData.telefono} onChange={handleRegisterChange} required />
                    </div>

                    <div className={styles.grupo_familia}>
                        <label htmlFor="nombre_familiar">Nombre del familiar</label>
                        <input id="nombre_familiar" type="text" className={styles.input} name="nombre_familiar" value={regPacienteData.nombre_familiar} onChange={handleRegisterChange} required />
                    </div>

                    <div className={styles.grupo_telfam}>
                        <label htmlFor="telefono_familiar">Número telefónico del familiar</label>
                        <input id="telefono_familiar" type="tel" className={styles.input} name="telefono_familiar" value={regPacienteData.telefono_familiar} onChange={handleRegisterChange} required />
                    </div>
                    
                    <div className={styles.gennero}>
                        <label htmlFor="genero">Género:</label>
                        <select id="genero" name="genero" className={styles.genero} value={regPacienteData.genero} onChange={handleRegisterChange} required>
                            <option value="">Elija una opción</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Femenino">Femenino</option>
                        </select>
                    </div>
                    {regPacienteData.genero === 'Femenino' && (
                        <div className={styles.mujer}>
                            <label htmlFor="embarazo">Embarazo/Lactancia</label>
                            <select id="embarazo" name="embarazo" className={styles.embarazo} value={regPacienteData.embarazo} onChange={handleRegisterChange} required>
                                <option value="">Elija una opción</option>
                                <option value="si">Sí</option>
                                <option value="no">No</option>
                            </select>
                        </div>
                    )}
                    <div className={styles.sangineo}>
                        <label htmlFor="sangineo">Grupo sanguíneo</label>
                        <select id="sangineo" name="sangineo" className={styles.sangre} value={regPacienteData.sangineo} onChange={handleRegisterChange} required>
                            <option value="">Elija una opción</option>
                            <option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option>
                            <option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option>
                        </select>
                    </div>
                    <div className={styles.grupo_ocup}>
                        <label htmlFor="ocupacion">Ocupación</label>
                        <input id="ocupacion" type="text" className={styles.input} name="ocupacion" value={regPacienteData.ocupacion} onChange={handleRegisterChange} required />
                    </div>
                    <div className={styles.escolaridad}>
                        <label htmlFor="escuela">Escolaridad</label>
                        <select id="escuela" name="escuela" className={styles.escuela} value={regPacienteData.escuela} onChange={handleRegisterChange} required>
                            <option value="">Elija una opción</option>
                            <option value="Prescolar">Prescolar</option><option value="Primaria">Primaria</option><option value="Secundaria">Secundaria</option>
                            <option value="Preparatoria">Preparatoria</option><option value="Licenciatura/Ingenieria">Licenciatura/Ingeniería</option>
                            <option value="Maestria/Doctorado">Maestría/Doctorado</option><option value="Analfabeta">Analfabeta</option><option value="No aplica">No aplica</option>
                        </select>
                    </div>
                    <div className={styles.Estado}>
                        <label htmlFor="estado_civil">Estado civil</label>
                        <select id="estado_civil" name="estado_civil" className={styles.estado_civil} value={regPacienteData.estado_civil} onChange={handleRegisterChange} required>
                            <option value="">Elija una opción</option>
                            <option value="Soltero/a">Soltero/a</option><option value="Casado/a">Casado/a</option>
                            <option value="Viudo/a">Viudo/a</option><option value="Union Libre">Unión libre</option>
                        </select>
                    </div>

                    <div className={styles.botones}>
                        <button className={styles.Agregar} type="submit">
                            Agregar
                        </button>
                        <Link to="/" className={styles.Cancelar}>Cancelar</Link>
                    </div>
                    
                </form>
            </div>
        </>
    );
}

export default FormularioPaciente;