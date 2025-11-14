import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import styles from './agregarcita.module.css';

// ¡CORREGIDO!: Apuntar al puerto 5000 (Backend)
const API_BASE_URL = 'https://consultorio-backend-287o.onrender.com/:5000'; // (Asegúrate que esta sea la IP de tu backend)

const FormularioAgregarcita = () =>{
    const navigate = useNavigate();
    const [vistaActiva, setVistaActiva] = useState('ante'); // 'ante', 'inter', o 'nota'
    const [searchParams] = useSearchParams();
    const pacienteId = searchParams.get('id');
    const pacienteNombre = searchParams.get('nombre');

    const [formData, setFormData] = useState({
        paciente_id: pacienteId,
        usuario_id: '',
        ant_diabetes: '', ant_arterial: '', ant_tiroidales: '', ant_otro: '',
        ant_tabaquismo: '', ant_alcohol: '', ant_actividad_fisica: '', ant_habitos_personales: '', ant_alimentacion: '', ant_vivienda: '',
        ant_enf_infancia: '', ant_enf_clinicas: '', ant_alergicos: '', ant_transfusiones: '', ant_traumatismo: '', ant_quirurgicos: '',
        padecimiento_actual: '',
        sis_digestivo: '', sis_respiracion: '', sis_cardio_vascular: '', sis_sistema_nervioso: '', sis_genitourinario: '',
        sis_musc_esquelet: '', sis_endocrino: '', sis_piel_anexos: '', comentarios_finales: '',
        nota_motivo: '', nota_padecimiento: '', nota_exploracion_fisica: '',
        exp_peso: '', exp_talla: '', sv_temp: '', sv_fr: '', sv_ta: '', sv_fc: '', sv_spo2: '', sv_gluc: '',
        diagnostico: '',
    });

    // Actualiza el paciente_id en el estado si la URL cambia
    useEffect(() => {
        setFormData(prevData => ({ ...prevData, paciente_id: pacienteId }));
    }, [pacienteId]);

    // Validación para asegurarse de que hay un ID de paciente
    useEffect(() => {
        if (!pacienteId) {
            console.error("No se seleccionó paciente (useEffect)");
            alert("Error: No se proporcionó un ID de paciente. Serás redirigido.");
            navigate('/pacientes'); // Lo mandamos a la lista de pacientes
        }
    }, [pacienteId, navigate]);

    // Efecto para los estilos de fondo
    useEffect(() => {
        // Asegúrate de que el ID 'cuerpo' exista en tu index.html o App.jsx
        const rootElement = document.getElementById('cuerpo') || document.body;
        rootElement.classList.add('fondoagregarcita');
        return () => {
            rootElement.classList.remove('fondoagregarcita');
        }
    }, []);

    // Manejador de cambios genérico
    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData(preventData => ({
            ...preventData,
            [name]: value
        }));
    };

    // Manejador para guardar la consulta
    const hanleGuardarCita = async (e) => {
        e.preventDefault(); // Previene que la página se recargue
        const userString = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if(!userString || !token) {
            alert("Error de autenticacion. Por favor, Inicia sesion de nuevo.");
            navigate('/login');
            return;
        }
        const user = JSON.parse(userString);

        const payload = {
            ...formData,
            usuario_id: user.id
        };

        console.log("Datos completos a enviar:", payload);

        try {
            const response = await fetch(`${API_BASE_URL}/api/consultas/registrar`,{
                method: `POST`,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (response.ok){
                alert("¡Historia clinica guardada con éxito!");
                
                // ¡CORREGIDO!: Redirige a la receta PASANDO EL ID
                navigate(`/receta?id=${pacienteId}`);

            }else{
                alert("Error al guardar: " + data.error);
            }
        }catch (error){
            console.error("Error de red:", error);
            alert("Error de conexion al guardar.");
        }
    };

    return(
        <>
        <nav className={styles.persona}>
            <div className={styles.person}>
                <i className="bi bi-person-circle"></i>
            </div>
            <h1>Consultorio</h1>
        </nav>

        <h1 className={styles.Cita}>Cita para: {pacienteNombre}</h1>
        
        <nav className={styles.navee}>
            <button className={`${styles.ante} ${styles.iniciall} ${vistaActiva === 'ante' ? styles.activo : ''}`} id="antes" onClick={() => setVistaActiva('ante')}>Antecedentes</button>
            <button className={`${styles.inter} ${vistaActiva === 'inter' ? styles.activo : ''}`} id="interr" onClick={() => setVistaActiva('inter')}>Interrogatorio por aparatos y sistema</button>
            <button className={`${styles.nota} ${vistaActiva === 'nota' ? styles.activo : ''}`} id="notaa" onClick={() => setVistaActiva('nota')}>Nota Medica</button>
        </nav>

        {/* El 'onSubmit' ahora sí funcionará */}
        <form onSubmit={hanleGuardarCita}>
            {vistaActiva ==='ante' && (
            <div className={`${styles.seccion} ${styles.tablaantee} ${styles.visible}`}>

            {/* Tabla Antecedentes Heredofamiliares */}
            <table className={styles.tableheredo}>
                <caption>Antecedentes Heredofamiliares</caption>
                <thead>
                    <tr>
                        <th>Concepto</th>
                        <th>Descripcion</th>
                    </tr>
                </thead>
                <tbody className={styles.cuerpoheredofamiliares}>
                    <tr>
                        <td className={styles.diabe}>Diabetes</td>
                        <td className={styles.texdiable}>
                            <input type="text" name="ant_diabetes" value={formData.ant_diabetes} 
                            onChange={handleChange}/>
                        </td>
                    </tr>
                    <tr className={styles.xd}>
                        <td>Hipertencion Arterial</td>
                        <td>
                            <input type="text" name="ant_arterial" value={formData.ant_arterial} onChange={handleChange} />
                        </td>
                    </tr>
                    <tr>
                        <td>Enfermedad Tiroidales</td>
                        <td>
                            <input type="text" name="ant_tiroidales" value={formData.ant_tiroidales} onChange={handleChange} />
                        </td>
                    </tr>
                    <tr>
                        <td>Otro</td>
                        <td>
                            <input type="text" name="ant_otro" value={formData.ant_otro} onChange={handleChange} />
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* Tabla de Antecedentes Personales no Patologicos */}
            <table className={styles.tablepersonales}>
                <caption>Antecedentes Personales no Patologicos</caption>
                <thead>
                    <tr>
                        <th>Concepto</th>
                        <th>Descripcion</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Tabaquismo</td>
                        <td>
                            <input type="text" name="ant_tabaquismo" value={formData.ant_tabaquismo} onChange={handleChange} />
                        </td>
                    </tr>
                    <tr>
                        <td>Alchol</td>
                        <td>
                            <input type="text" name="ant_alcohol" value={formData.ant_alcohol} onChange={handleChange} />
                        </td>
                    </tr>
                    <tr>
                        <td>Actividad Fisica</td>
                        <td>
                            <input type="text" name="ant_actividad_fisica" value={formData.ant_actividad_fisica} onChange={handleChange} />
                        </td>
                    </tr>
                    <tr>
                        <td>Habitos Personales</td>
                        <td>
                            <input type="text" name="ant_habitos_personales" value={formData.ant_habitos_personales} onChange={handleChange}/>
                        </td>
                    </tr>
                    <tr>
                        <td>Akimentacion</td>
                        <td>
                            <input type="text" name="ant_alimentacion" value={formData.ant_alimentacion} onChange={handleChange}/>
                        </td>
                    </tr>
                    <tr>
                        <td>Vivienda</td>
                        <td>
                            <input type="text" name="ant_vivienda" value={formData.ant_vivienda} onChange={handleChange}/>
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* Tabla Antecedentes Personales Patologicos */}
            <table className={styles.tablepatologicos}>
                <caption>Antecedentes Personales Patologicos</caption>
                <thead>
                    <tr>
                        <th>Concepto</th>
                        <th>Descripcion</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Enfermedades de la Infancia</td>
                        <td>
                            <input type="text" name="ant_enf_infancia" value={formData.ant_enf_infancia} onChange={handleChange}/>
                        </td>
                    </tr>
                    <tr>
                        <td>Enfermedades Clinicas</td>
                        <td>
                            <input type="text" name="ant_enf_clinicas" value={formData.ant_enf_clinicas} onChange={handleChange}/>
                        </td>
                    </tr>
                    <tr>
                        <td>Antecedentes Alérgicos</td>
                        <td>
                            <input type="text" name="ant_alergicos" value={formData.ant_alergicos} onChange={handleChange}/>
                        </td>
                    </tr>
                    <tr>
                        <td>Antecedentes de Transfusiones</td>
                        <td>
                            <input type="text" name="ant_transfusiones" value={formData.ant_transfusiones} onChange={handleChange}/>
                        </td>
                    </tr>
                    <tr>
                        <td>Antecedentes de Traumatismo</td>
                        <td>
                            <input type="text" name="ant_traumatismo" value={formData.ant_traumatismo} onChange={handleChange}/>
                        </td>
                    </tr>
                    <tr>
                        <td>Antecedentes Quirúrgicos</td>
                        <td>
                            <input type="text" name="ant_quirurgicos" value={formData.ant_quirurgicos} onChange={handleChange}/>
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* Padecimiento Medico */}
            <div className={styles.pademedico}>
                <h3>Padecimiento Medico Actual</h3>
                <textarea className={styles.trata} name="padecimiento_actual" value={formData.padecimiento_actual} onChange={handleChange}/>
            </div>
        </div>
        )}

        {/* ==== Tabla de Interrogatorio por Aparatos y sistemas ==== */}
        {vistaActiva === 'inter' &&(
            <div className={`${styles.seccion} ${styles.interrogatorio} ${styles.visible}`}>
            <table className={styles.aparatsistema}>
                <caption>Aparatos y sistemas</caption>
                <thead>
                    <tr>
                        <th>Zona</th>
                        <th>Descripcion</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Diagestivo</td>
                        <td>
                            <input type="text" name="sis_digestivo" value={formData.sis_digestivo} onChange={handleChange}/>
                        </td>
                    </tr>
                    <tr>
                        <td>Respiracion</td>
                        <td>
                            <input type="text" name="sis_respiracion" value={formData.sis_respiracion} onChange={handleChange}/>
                        </td>
                    </tr>
                    <tr>
                        <td>Cardio Vascular</td>
                        <td>
                            <input type="text" name="sis_cardio_vascular" value={formData.sis_cardio_vascular} onChange={handleChange}/>
                        </td>
                    </tr>
                    <tr>
                        <td>Sistema Nervioso</td>
                        <td>
                            <input type="text" name="sis_sistema_nervioso" value={formData.sis_sistema_nervioso} onChange={handleChange}/>
                        </td>
                    </tr>
                    <tr>
                        <td>Genitoutinario</td>
                        <td>
                            <input type="text" name="sis_genitourinario" value={formData.sis_genitourinario} onChange={handleChange}/>
                        </td>
                    </tr>
                    <tr>
                        <td>Musc. Esquelet</td>
                        <td>
                            <input type="text" name="sis_musc_esquelet" value={formData.sis_musc_esquelet} onChange={handleChange}/>
                        </td>
                    </tr>
                    <tr>
                        <td>Endocrino</td>
                        <td>
                            <input type="text" name="sis_endocrino" value={formData.sis_endocrino} onChange={handleChange}/>
                        </td>
                    </tr>
                    <tr>
                        <td>Piel y Anexos</td>
                        <td>
                            <input type="text" name="sis_piel_anexos" value={formData.sis_piel_anexos} onChange={handleChange}/>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>  
        )}

        {/* ==== Nora Medica ==== */}
        {vistaActiva === 'nota' &&(
            <div className={`${styles.seccion} ${styles.notmedic} ${styles.visible}`}>
                {/* Interrogatorio */}
                <h2>Interrogatorio</h2>
                <div className={styles.interr}>
                    <div className={styles.motivo}>
                        <input type="text" name="nota_motivo" value={formData.nota_motivo} onChange={handleChange} placeholder=" " id="motivo"/> <label htmlFor="motivo">Motivo de la Consulta</label>
                    </div>
                    <div className={styles.pade}>
                        <input type="text" name="nota_padecimiento" value={formData.nota_padecimiento} onChange={handleChange} placeholder=" " id="pade"/><label htmlFor="pade">Padecimiento</label>
                    </div>
                    <div className={styles.fisi}>
                        <input type="text" name="nota_exploracion_fisica" value={formData.nota_exploracion_fisica} onChange={handleChange} placeholder=" " id="fisi"/> <label htmlFor="fisi">Exploracion Fisica</label>
                    </div>
                </div>

                {/* Exploracion */}
                <div className={styles.explo}> 
                    <h2>Exploracion</h2>
                    <div className={styles.peso}>
                            <label htmlFor="peso">Peso</label>
                            <input type="text" id="peso" name="exp_peso" value={formData.exp_peso} onChange={handleChange} />
                            <label htmlFor="peso">kg</label>
                    </div>
                    <div className={styles.talla}>
                        <label htmlFor="talla">Talla</label>
                        <input type="text" id="talla" name="exp_talla" value={formData.exp_talla} onChange={handleChange}/>
                        <label htmlFor="talla">cm</label>
                    </div>
                </div>

                {/* Signos Vitales */}
                <div className={styles.signos}>
                    <h2>Signos Vitales</h2>
                    <div className={styles.temp}>
                        <label htmlFor="temp">Temp</label>
                        <input type="text" id="temp" name="sv_temp" value={formData.sv_temp} onChange={handleChange} />
                        <label htmlFor="temp">c°</label>
                    </div>
                    <div className={styles.fr}>
                        <label htmlFor="fr">F.R</label>
                        <input type="text" id="fr" name="sv_fr" value={formData.sv_fr} onChange={handleChange}/>
                        <label htmlFor="fr">XMIN</label>
                    </div>
                    <div className={styles.ta}>
                        <label htmlFor="ta">T.A</label>
                        <input type="text" id="ta" name="sv_ta" value={formData.sv_ta} onChange={handleChange} />
                        <label htmlFor="ta">MMHG</label>
                    </div>
                    <div className={styles.fc}>
                        <label htmlFor="fc">F.C</label>
                        <input type="text" id="fc" name="sv_fc" value={formData.sv_fc} onChange={handleChange} />
                        <label htmlFor="fc">XMIN</label>
                    </div>
                    <div className={styles.SP}>
                        <label htmlFor="sp">SpO2</label>
                        <input type="text" id="sp" name="sv_spo2" value={formData.sv_spo2} onChange={handleChange}/>
                        <label htmlFor="sp">%</label>
                    </div>
                    <div className={styles.gluc}>
                        <label htmlFor="glu">GLUC</label>
                        <input type="text" id="glu" name="sv_gluc" value={formData.sv_gluc} onChange={handleChange} />
                        <label htmlFor="glu">MG/DL</label>
                    </div>
                </div>
                {/* Comentarios Finales */}
                <div className={styles.comentafinal}>
                    <h3>Comentarios Finales</h3>
                    <textarea className={styles.trata} name="comentarios_finales" value={formData.comentarios_finales} onChange={handleChange}/>
                </div>

                {/* ¡CORREGIDO!: Este es un botón de submit real */}
                <button type="submit" className={styles.env}>Guardar</button>
                
            </div>
        )}
        </form>
       </>
    )
}

export default FormularioAgregarcita;