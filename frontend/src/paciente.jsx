import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import styles from './paciente.module.css';

// ==========================================================
//           ⬇️ ¡ESTA ES LA CORRECCIÓN! ⬇️
// Esta es la URL de tu BACKEND en Render.
const API_BASE_URL = 'https://consultorio-backend-287o.onrender.com';
// ==========================================================


// --- Función para calcular la edad ---
function calcularEdad(fechaNacimientoStr) {
    if (!fechaNacimientoStr) return 'Edad no disponible';
    const fechaNacimiento = new Date(fechaNacimientoStr);
    const hoy = new Date ();

    let años = hoy.getFullYear() - fechaNacimiento.getFullYear();
    let meses = hoy.getMonth() - fechaNacimiento.getMonth();
    let dias = hoy.getDate() - fechaNacimiento.getDate();
    
    if (dias < 0) { 
        meses--; 
        const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate(); 
        dias += mesAnterior; 
    }
    if (meses < 0) { 
        años--; 
        meses += 12; 
    }

    if (años > 0) {
        return `${años} año${años > 1 ? 's' : ''}`;
    } else if (meses > 0) {
        return `${meses} mes${meses > 1 ? 'es' : ''}`;
    } else if (dias > 0) {
        return `${dias} día${dias > 1 ? 's' : ''}`;
    } else {
        return 'Recién nacido';
    }
}

// --- Componente principal ---
function ListaPacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Función para Eliminar Paciente ---
  const handleDelete = async (idPaciente) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar a este paciente? Esta acción no se puede deshacer.")) {
      return; 
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError("Acceso denegado. No se encontró token.");
      return;
    }

    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    try {
      // ==========================================================
      //           ⬇️ ¡ESTA ES LA CORRECCIÓN! ⬇️
      await axios.delete(`${API_BASE_URL}/api/pacientes/${idPaciente}`, config);
      // ==========================================================
      
      // Actualiza el estado para quitar al paciente de la lista
      setPacientes(pacientesActuales => 
        pacientesActuales.filter(paciente => paciente.paciente_id !== idPaciente)
      );

    } catch (err) {
      console.error("Error al eliminar paciente:", err);

      if (err.response && (err.response.status === 409 || err.response.status === 404)) {
        alert(err.response.data.message); 
      } else {
        alert("No se pudo eliminar al paciente. Inténtalo de nuevo.");
      }
    }
  };


  // --- Cargar pacientes al montar el componente ---
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setError("Acceso denegado. Por favor, inicia sesión.");
      setLoading(false);
      return;
    }

    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    // ==========================================================
    //           ⬇️ ¡ESTA ES LA CORRECCIÓN! ⬇️
    axios.get(`${API_BASE_URL}/api/pacientes`, config) 
    // ==========================================================
      .then(res => {
        // 'res.data' ahora SÍ será un array [ ... ]
        setPacientes(res.data);
        setLoading(false); 
      })
      .catch(err => {
        console.error("Error al cargar pacientes:", err);
        if (err.response && err.response.status === 401) {
          setError("Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.");
        } else {
          setError("No se pudieron cargar los datos.");
        }
        setLoading(false); 
      });
  }, []); // El array vacío asegura que se ejecute solo una vez

  // --- Renderizado ---
  if (loading) {
    return <div>Cargando pacientes...</div>;
  }
  
  if (error) {
    return <div style={{ color: 'red', padding: '20px', fontWeight: 'bold' }}>{error}</div>;
  }

  return (
    <div className={styles.contenedorpaciente}>
        <h2>Registro de Pacientes</h2>
        <div className={styles.tarjetas}>
            
            {/* Este .map() ahora funcionará */}
            {pacientes.map(paciente => (
                <div className={styles.tarjetapaciente} key={paciente.paciente_id}>
                    
                    <div className={styles.iconotarjeta}>
                        <i className="bi bi-person-badge-fill"></i>
                    </div>
                    <div className={styles.tarjetainfo}>
                        <p className={styles.p}>No_Expediente:{paciente.no_expediente}</p>
                        <h3 className={styles.nombre}>{paciente.nombre_paciente}</h3>
                        <p className={styles.edad}>{calcularEdad(paciente.fecha_nacimiento)}</p>
                    </div>
                    
                    <div className={styles.tarjetaAcciones}>
                        
                        {/* 1. Botón de agendar cita (Historia Clínica) */}
                        <Link to={`/agregarcita?id=${paciente.paciente_id}&nombre=${paciente.nombre_paciente}`} className={styles.botonCita}>
                            <i className="bi bi-calendar-plus"></i>
                        </Link>
                        
                        {/* 2. Botón de Receta */}
                        <Link to={`/receta?id=${paciente.paciente_id}`} className={styles.botonCita}>
                            <i className="bi bi-file-medical"></i>
                        </Link>

                        {/* 3. Botón de eliminar */}
                        <button 
                            onClick={() => handleDelete(paciente.paciente_id)} 
                            className={`${styles.botonEliminar} ${styles.botonCita}`}
                        >
                            <i className="bi bi-trash-fill"></i>
                        </button>

                    </div>
                </div>
            ))}
        </div>
    </div>
  );
}

export default ListaPacientes;