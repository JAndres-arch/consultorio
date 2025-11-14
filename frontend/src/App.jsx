import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom';

// Componentes
import Login from './login.jsx';
import ProtectedRoute from './protectedRoute.jsx'; // Middleware de seguridad
import Inicio from './inicio.jsx';        // Dashboard principal
import FormularioPaciente from './agregarpaciente.jsx';
import FormularioAgregarcita from './agregarcita.jsx';
import ListaPacientes from './paciente.jsx';
import RecetaForm from './receta.jsx';
//import FormularioAgregarcita from './agregarcita.jsx';

const App = () => {
  return (
    <Router>
      <Routes>

        {/* ========================================= */}
        {/* RUTA PÚBLICA: /login */}
        {/* ========================================= */}
        {/* Esta ruta es pública y cualquiera puede verla */}
        <Route path="/login" element={<Login />} />


        {/* ========================================= */}
        {/* RUTAS PRIVADAS: Todas las demás */}
        {/* ========================================= */}
        
        {/* Esta es la parte clave. 
          Este <Route> "envuelve" a todas las rutas de adentro.
          Forzará a que <ProtectedRoute /> se ejecute PRIMERO.
        */}
        <Route element={<ProtectedRoute />}>

          {/* Estas rutas son "hijas" de ProtectedRoute. */}
          {/* Solo se mostrarán si ProtectedRoute da permiso. */}
          
          <Route path="/" element={<Inicio />} />
          <Route path="/agregarpaciente" element={<FormularioPaciente />} />

          <Route path="/agregarcita" element={<FormularioAgregarcita/>}/>
          <Route path="/paciente" element={<ListaPacientes/>}/>
          <Route path="/receta" element={<RecetaForm />} />
          
          {/* <Route path="/citas" element={<VerCitas />} /> */}
          {/* <Route path="/pacientes/:id" element={<DetallePaciente />} /> */}

        </Route> {/* <-- Aquí se cierra el envoltorio de ProtectedRoute */}

      </Routes>
    </Router>
  );
};

export default App;