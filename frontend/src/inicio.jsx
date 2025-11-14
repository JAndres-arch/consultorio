import styles from './inicio.module.css';
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Inicio() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login'); 
    };

    useEffect(() => {
        const rootElement = document.getElementById('root');
        rootElement.classList.add('bienvenido');
        return () => {
            rootElement.classList.remove('bienvenido');
        };
    }, []);

    const [isMenuVisible, setIsMenuVisible] = useState(false);

    const handleIconClick = () => {
        setIsMenuVisible(!isMenuVisible);
    };

    console.log(styles);

    return (
        <>
            <div className="principal">
                <nav className={styles.nav}>
                    <div className={styles.icono}>
                        <i className="bi bi-person-circle"></i>
                    </div>

                    <h1 className={styles.navh1}>MIMI MEDIC</h1>

                    <div className={styles.icono}>
                        <i className="bi bi-search-heart"></i>
                    </div>

                    <div className={`${styles.icono} ${styles.menu}`}>
                        <i className="bi bi-list" onClick={handleIconClick}></i>
                    </div>

                    {isMenuVisible && (
                        <div className={styles.menuflotante}>
                            
                            <div className={styles.close}>
                                <i className="bi bi-x" onClick={handleIconClick}></i>
                            </div>

                            <ul className={styles.lu}>
                                <li className={styles.li}><Link to="/paciente" className={styles.cita}>Pacientes</Link></li>
                                <li className={styles.li}>Registro de historias clinicas</li>
                                <li className={styles.li}>Registro de cartas de concentimiento</li>
                                <li className={styles.li}>Nota medica</li>
                            </ul>
                            <div className={styles.cerrar}>
                                <i className="bi bi-box-arrow-in-left"></i>
                                <button className={styles.secion} onClick={handleLogout}>Cerrar Sesión</button>
                            </div>
                        </div>
                    )}

                </nav>

                <div className={styles.opciones}>
                    <Link to="/agregarpaciente" className={styles.paciente} id="paciente"> Agregar Paciente</Link>
                    <Link to="/paciente" className={styles.cita}>Agregar Cita</Link>
                </div>

                <div className={styles.table}> 
                    <table>
                        <caption className={styles.caption}>Citas</caption>
                        <thead>
                            <tr>
                                <th className={styles.sup}>Nombre del paciente</th>
                                <th className={styles.sup}>Fecha</th>
                                <th className={styles.sup}>Documento</th>
                            </tr>
                        </thead>
                    </table>
                </div>
            </div>

        </>
    )
}

//  ESTO DEBE COINCIDIR CON EL NOMBRE DE LA FUNCIÓN ARRIBA 
export default Inicio;