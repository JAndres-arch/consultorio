import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from './login.module.css';

// =================================================================================
// 🚨 ARREGLO CRÍTICO: HACER LA URL DINÁMICA Y APUNTAR AL BACKEND (sin :5000)
//
// ⚠️ REEMPLAZA 'https://URL-DE-TU-BACKEND.onrender.com' CON TU URL REAL DE RENDER
// =================================================================================
const API_BASE_URL =
  window.location.hostname === "localhost" || window.location.hostname === "192.168.0.29"
    ? "http://localhost:5000/api"
    : "https://consultorio-backend-287o.onrender.com/api";


const Login = () => {
    const navigate = useNavigate();
    const [isLoginView, setIsLoginView] = useState(true);
    const [message, setMessage] = useState({ text: '', type: ''});

    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [registerData, setRegisterData] = useState({
        nombre: '',
        cedu: '',
        telefono: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleLoginChange = (e) => {
        setLoginData({ ...loginData, [e.target.name]: e.target.value });
    };

    const handleRegisterChange = (e) => {
        setRegisterData({ ...registerData, [e.target.name]: e.target.value });
    };

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    };

    const validateRegister = () => {
        const { nombre, cedu, telefono, email, password, confirmPassword } = registerData;

        if (!nombre || !cedu || !telefono || !email || !password || !confirmPassword) {
            showMessage("Por favor llena todos los campos.", "error");
            return false;
        }
        // [CÓDIGO DE VALIDACIÓN DE REGISTRO SE MANTIENE IGUAL]
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
             showMessage("Por favor, ingrese un correo valido.", "error");
             return false;
        }
        if (password.length < 8) {
            showMessage("La contraseña debe tener al menos 8 caracteres.", "error");
            return false;
        }
        if (password !== confirmPassword) {
            showMessage("Las contraseñas no coinciden.", "error");
            return false;
        }
        const telefonoSinEspacios = telefono.replace(/\s+/g, '');
        const telefonoRegex = /^\d{10}$/;
        if (!telefonoRegex.test(telefonoSinEspacios)) {
             showMessage("Introduzca un número válido de 10 dígitos.", "error");
             return false;
        }
        return true;
    };

    // =================================================================================
    // FUNCIÓN DE REGISTRO CORREGIDA
    // =================================================================================
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        if (!validateRegister()) return;
        showMessage("Enviando datos de registro...", "success");

        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: registerData.nombre,
                    cedu: registerData.cedu,
                    telefono: registerData.telefono,
                    email: registerData.email,
                    password: registerData.password
                }),
            });

            // Si no fue OK (Error 400/500), intenta leer el error; si no es JSON, usa un mensaje genérico.
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Fallo en el registro (Respuesta no legible).' }));
                showMessage(errorData.error || 'Fallo en el registro.', "error");
                return;
            }
            
            // Si es OK, lee el JSON y procede.
            const data = await response.json();
            showMessage("Registro exitoso. Inicia sesión ahora.", "success");
            setTimeout(() => setIsLoginView(true), 2000);

        } catch (error) {
            console.error("Fallo general en el registro:", error);
            showMessage("Error de conexión con el servidor. Verifica tu URL de API.", "error");
        }
    };

    // =================================================================================
    // FUNCIÓN DE LOGIN CORREGIDA
    // =================================================================================
    const handleLoginSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData),
            });

            // A. Si la respuesta NO fue exitosa (400, 500, etc.)
            if (!response.ok) {
                // Leemos el error, protegiéndonos si el backend no devuelve JSON
                const errorData = await response.json().catch(() => ({ error: 'Error de servidor. Vuelva a intentarlo.' }));
                showMessage(errorData.error || 'Credenciales inválidas.', "error");
                return; 
            }
            
            // B. Si la respuesta fue exitosa (código 200)
            const data = await response.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            showMessage("Inicio de sesión exitoso.", "success");
            setTimeout(() => navigate('/'), 500);

        } catch (error) {
            console.error("Fallo general en el login:", error);
            showMessage("Error de conexión con el servidor.", "error");
        }
    };

    useEffect(() => {
        const rootElement = document.getElementById('root');
        rootElement.classList.add('fondologin');
        return () => {
            rootElement.classList.remove('fondologin');
        };
    }, []);

    return (
        <div className={styles.contenedorr}>
            <div className={`${styles.contenedor} ${isLoginView ? '' : styles.oculto}`} id="login" >
                <form action="" className={styles.formulario} onSubmit={handleLoginSubmit}>

                    <h1 className={styles.loginh1}>MIMI MEDIC</h1>

                    <div className={styles.inicio}>
                        <i className="bi bi-envelope-at-fill"></i>
                        <input className={styles.input} type="email" id="email" placeholder="Correo" name="email" required value={loginData.email} onChange={handleLoginChange}/>
                    </div>

                    <div className={styles.inicio}>
                        <i className="bi bi-lock-fill"></i>
                        <input className={styles.input} type="password" id="password" placeholder="Contraseña" name="password" required value={loginData.password} onChange={handleLoginChange}/>
                    </div>

                    <button className={styles.aceptar} id="aceptar" type="submit">Aceptar</button>
                    <button className={styles.registrarse} type="button" onClick={() => setIsLoginView(false)}>Registrarse</button>
                    <p id="mensaje" className={`mensaje ${message.type}`}>{message.text}</p>
                </form>
            </div>

            {/* Registro */}

            <div className={`${styles['regcontenedor']} ${isLoginView ? styles.oculto : ''}`} id="Container">
                <form action="" className={styles.regformulario} id="regis-formulario" onSubmit={handleRegisterSubmit}> 

                    <h1 className={styles.regh1}>MIMI MEDIC</h1>

                    <div className={styles.inicio}>
                        <i className="bi bi-person-fill-add"></i>
                        <input className={styles.input} type="text" id="nombre" placeholder="Nombre" name="nombre" required value={registerData.nombre} onChange={handleRegisterChange}/>
                    </div>

                    <div className={styles.inicio}>
                        <i className="bi bi-person-vcard-fill"></i>
                        <input className={styles.input} type="text" id="cedu" placeholder="Cedúla Profesional" name="cedu" required value={registerData.cedu} onChange={handleRegisterChange}/>
                    </div>

                    <div className={styles.inicio}>
                        <i className="bi bi-telephone-fill"></i>
                        <input className={styles.input} type="tel" id="telefono" placeholder="Numéro Celular" name="telefono" required value={registerData.telefono} onChange={handleRegisterChange}/>
                    </div>

                    <div className={styles.inicio}>
                        <i className="bi bi-envelope-at-fill"></i>
                        <input className={styles.input} type="email" id="reg-email" placeholder="Correo" name="email" required value={registerData.email} onChange={handleRegisterChange}/>
                    </div>

                    <div className={styles.inicio}>
                        <i className="bi bi-lock-fill"></i>
                        <input className={styles.input} type="password" id="reg-password" placeholder="Contraseña" name="password" required value={registerData.password} onChange={handleRegisterChange}/>
                    </div>

                    <div className={styles.inicio}>
                        <i className="bi bi-lock-fill"></i>
                        <input className={styles.input} type="password" id="confirm-password" name="confirmPassword" placeholder="Confirme la contraseña" required value={registerData.confirmPassword} onChange={handleRegisterChange}/>
                    </div>

                    <button className={styles.aceptar2} type="submit">Aceptar</button>
                    <button className={styles.regresar} type="button" onClick={() => setIsLoginView(true)}>Login</button>
                    <p id="mensaje" className={`mensaje ${message.type}`}>{message.text}</p>
                </form>

            </div>

        </div>
    );
};

export default Login;