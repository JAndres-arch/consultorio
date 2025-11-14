import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const verificarAuth = () => {
    console.log("--- 1. Ejecutando VerificarAuth()...");
    const token = localStorage.getItem('token');
    console.log("--- 3. Valor del 'token' encontrado:", token);
    return !!token;
};

const ProtectedRoute = () => {
    console.log("--- 3. Renderizado ProtectedRoute...");

    const estaAutenticado = verificarAuth();

    console.log("--- 4. ¿Esta autenticado? (¿Es true o false?):", estaAutenticado);

    if (estaAutenticado){
        console.log("--- 5.Decisiom: Autenticado. Mostrado <Outle /> (Inicio).");
    }else {
        console.log("--- 6. Decision: No Autenticado. Redirigiendo a /login.");
    }

    return estaAutenticado ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;