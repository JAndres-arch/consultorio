import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useReactToPrint } from 'react-to-print';
import styles from './receta.module.css';

// --- Función para calcular la edad ---
function calcularEdad(fechaNacimientoStr) {
    if (!fechaNacimientoStr) return '';
    const fechaNacimiento = new Date(fechaNacimientoStr);
    const hoy = new Date();
    let años = hoy.getFullYear() - fechaNacimiento.getFullYear();
    let meses = hoy.getMonth() - fechaNacimiento.getMonth();
    if (meses < 0 || (meses === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
        años--;
    }
    return `${años} años`;
}

// --- Componente de Receta ---
function RecetaForm() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const consultaId = searchParams.get('consulta_id');
    const pacienteId_desde_lista = searchParams.get('id');

    const [paciente, setPaciente] = useState(null);
    const [doctor, setDoctor] = useState(null);
    const [consulta, setConsulta] = useState(null); 

    const [fecha, setFecha] = useState(new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }));
    const [talla, setTalla] = useState('');
    const [peso, setPeso] = useState('');
    const [imc, setImc] = useState('');
    const [ta, setTa] = useState('');
    const [fc, setFc] = useState('');
    const [fr, setFr] = useState('');
    const [temp, setTemp] = useState('');

    const [diagnostico, setDiagnostico] = useState('');
    const [medicamentos, setMedicamentos] = useState('');
    const [indicaciones, setIndicaciones] = useState('');
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Lógica de Carga de Datos ---
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError("Acceso denegado. Inicia sesión.");
            setLoading(false);
            return;
        }
        const config = { headers: { 'Authorization': `Bearer ${token}` } };

        const cargarDatosCompletos = async (cId) => {
            try {
                const resConsulta = await axios.get(`https://consultorio-backend-287o.onrender.com:5000/api/consultas/${cId}`, config);
                const consultaData = resConsulta.data;
                setConsulta(consultaData);
                const resPaciente = await axios.get(`https://consultorio-backend-287o.onrender.com:5000/api/pacientes/${consultaData.paciente_id}`, config);
                setPaciente(resPaciente.data);
                const resDoctor = await axios.get(`https://consultorio-backend-287o.onrender.com:5000/api/usuario/actual`, config);
                setDoctor(resDoctor.data);
                setTalla(consultaData.exp_talla || '');
                setPeso(consultaData.exp_peso || '');
                setTa(consultaData.sv_ta || '');
                setFc(consultaData.sv_fc || '');
                setFr(consultaData.sv_fr || '');
                setTemp(consultaData.sv_temp || '');
                setDiagnostico(consultaData.diagnostico || '');
                setLoading(false);
            } catch (err) {
                console.error("Error al cargar datos completos:", err);
                setError("No se pudieron cargar los datos de la consulta.");
                setLoading(false);
            }
        };

        const cargarDatosSimples = async (pId) => {
            try {
                const resPaciente = await axios.get(`https://consultorio-backend-287o.onrender.com:5000/api/pacientes/${pId}`, config);
                setPaciente(resPaciente.data);
                const resDoctor = await axios.get(`https://consultorio-backend-287o.onrender.com:5000/api/usuario/actual`, config);
                setDoctor(resDoctor.data);
                setLoading(false);
            } catch (err) {
                console.error("Error al cargar datos simples:", err);
                setError("No se pudieron cargar los datos del paciente o doctor.");
                setLoading(false);
            }
        };

        if (consultaId) {
            cargarDatosCompletos(consultaId);
        } else if (pacienteId_desde_lista) {
            cargarDatosSimples(pacienteId_desde_lista);
        } else {
            setError("No se proporcionó un ID de paciente o de consulta.");
            setLoading(false);
        }
    }, [consultaId, pacienteId_desde_lista]);

    // --- Calcular IMC ---
    useEffect(() => {
        const tallaNum = parseFloat(talla);
        const pesoKg = parseFloat(peso);
        if (tallaNum > 0 && pesoKg > 0) {
            const tallaEnMetros = tallaNum / 100;
            if (tallaEnMetros > 0) {
                const imcCalculado = pesoKg / (tallaEnMetros * tallaEnMetros);
                setImc(imcCalculado.toFixed(2));
            }
        } else {
            setImc('');
        }
    }, [talla, peso]);

    // --- Guardar Receta ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!medicamentos) {
            alert("El campo de medicamentos no puede estar vacío.");
            return;
        }
        const token = localStorage.getItem('token');
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        
        const datosReceta = {
            paciente_id: paciente.paciente_id,
            usuario_id: doctor.usuario_id,
            consulta_id: consultaId, 
            diagnostico: diagnostico,
            medicamentos: medicamentos,
            indicaciones_adicionales: indicaciones
        };
        try {
            await axios.post('https://consultorio-backend-287o.onrender.com:5000/api/recetas', datosReceta, config);
            alert("Receta guardada exitosamente");
            navigate('/pacientes');
        } catch (err) {
            console.error("Error al guardar receta:", err);
            alert(`Error al guardar la receta. Revisa la consola.`);
        }
    };

    // --- Lógica de Impresión (CORREGIDA para react-to-print@3.2.0) ---
    const componentRef = useRef(null);

    const handlePrint = useReactToPrint({
        contentRef: componentRef, // ✅ Nueva API en v3.x
        documentTitle: `Receta-${paciente?.nombre_paciente || 'paciente'}`,
    });

    // --- Renderizado ---
    if (loading) return <div>Cargando datos...</div>;
    if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
    if (!paciente || !doctor) return <div>No se encontraron datos.</div>;

    const edadPaciente = calcularEdad(paciente.fecha_nacimiento);

    return (
        <div className={styles.contenedor}>
            
            {/* --- SECCIÓN 1: EL FORMULARIO PARA EDITAR --- */}
            <form onSubmit={handleSubmit} className={styles.contenedorFormulario}>
                <h2 className={styles.tituloEditor}>Receta Medica</h2>
                
                {/* --- Signos vitales --- */}
                <fieldset className={styles.signosVitales}>
                    <legend>Signos Vitales {consultaId ? "(Cargados de la consulta)" : "(Llenado manual)"}</legend>
                    <div className={styles.gridVitales}>
                        <div><label>Talla (cm)</label><input type="number" step="0.01" value={talla} onChange={(e) => setTalla(e.target.value)} /></div>
                        <div><label>Peso (kg)</label><input type="number" step="0.1" value={peso} onChange={(e) => setPeso(e.target.value)} /></div>
                        <div><label>IMC</label><input type="text" value={imc} readOnly className={styles.inputBloqueado} /></div>
                        <div><label>TA (mmHg)</label><input type="text" value={ta} onChange={(e) => setTa(e.target.value)} /></div>
                        <div><label>FC (lpm)</label><input type="number" value={fc} onChange={(e) => setFc(e.target.value)} /></div>
                        <div><label>FR (rpm)</label><input type="number" value={fr} onChange={(e) => setFr(e.target.value)} /></div>
                        <div><label>Temp (°C)</label><input type="number" step="0.1" value={temp} onChange={(e) => setTemp(e.target.value)} /></div>
                    </div>
                </fieldset>
                
                <div className={styles.grupoForm}>
                    <label><strong>Diagnóstico:</strong></label>
                    <input type="text" value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} />
                </div>

                <div className={styles.grupoForm}>
                    <label><strong>Medicamentos (Rp.):</strong></label>
                    <textarea value={medicamentos} onChange={(e) => setMedicamentos(e.target.value)} rows="10" required />
                </div>

                <div className={styles.grupoForm}>
                    <label><strong>Indicaciones Adicionales:</strong></label>
                    <textarea value={indicaciones} onChange={(e) => setIndicaciones(e.target.value)} rows="3" />
                </div>

                <div className={styles.grupoBotones}>
                    <button type="submit" className={styles.botonGuardar}>
                        Guardar Receta
                    </button>
                    <button type="button" onClick={handlePrint} className={styles.botonImprimir}>
                        Imprimir / Guardar PDF
                    </button>
                </div>
            </form>

            <hr className={styles.divisor} />

            {/* --- SECCIÓN 2: LA VISTA PREVIA IMPRIMIBLE --- */}
            {/* (Este div usa 'ref', no 'className', para que la impresión funcione) */}
            <div
                ref={componentRef}
                className={styles.vistaImprimible} // Clase base para la impresión
            >
                <div className={styles.encabezadoReceta}>
                    <div className={styles.datosDoctor}>
                        <h3>Dr(a). {doctor.nombre}</h3>
                        <p>Cédula Prof. {doctor.cedu || '(Cédula no registrada)'}</p>
                    </div>
                    <div className={styles.tituloReceta}>
                        <h2>RECETA MÉDICA</h2>
                        <p><strong>Fecha:</strong> {fecha}</p>
                    </div>
                </div>

                <div className={styles.seccionPaciente}>
                    <h4>Datos del Paciente</h4>
                    <div className={styles.gridPaciente}>
                        <p><strong>Nombre:</strong> {paciente.nombre_paciente}</p>
                        <p><strong>Edad:</strong> {edadPaciente}</p>
                        <p><strong>Género:</strong> {paciente.genero}</p>
                    </div>
                </div>

                <div className={styles.seccionVitales}>
                    <h4>Signos Vitales</h4>
                    <div className={styles.gridVitalesImpresion}>
                        <p><strong>Talla:</strong> {talla || 'N/A'} cm</p>
                        <p><strong>Peso:</strong> {peso || 'N/A'} kg</p>
                        <p><strong>IMC:</strong> {imc || 'N/A'}</p>
                        <p><strong>TA:</strong> {ta || 'N/A'} mmHg</p>
                        <p><strong>FC:</strong> {fc || 'N/A'} lpm</p>
                        <p><strong>Temp:</strong> {temp || 'N/A'} °C</p>
                    </div>
                </div>

                <div className={styles.seccionDiagnostico}>
                    <label><strong>Diagnóstico:</strong></label>
                    <p>{diagnostico || "(No especificado)"}</p>
                </div>

                <div className={styles.seccionMedicamentos}>
                    <strong className={styles.rp}>Rp.</strong>
                    <pre>{medicamentos || "(No especificado)"}</pre>
                </div>

                <div className={styles.seccionIndicaciones}>
                    <label><strong>Indicaciones Adicionales:</strong></label>
                    <pre>{indicaciones || "(No especificado)"}</pre>
                </div>

                <div className={styles.areaFirma}>
                    <div className={styles.lineaFirma}>
                        <p>Firma del Médico</p>
                        <p>Dr(a). {doctor.nombre}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RecetaForm;
