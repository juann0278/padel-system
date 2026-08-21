import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Clock, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  Shield, 
  User, 
  Lock, 
  LogOut, 
  PlusCircle, 
  X, 
  Filter, 
  MessageCircle, 
  ArrowRight, 
  Calendar, 
  Repeat, 
  Trophy,
  Ban,
  Hammer,
  Moon
} from 'lucide-react';

import FONDO from './assets/FONDO.jpg.avif';

const API_BASE = 'http://localhost:8080/api/v1';
const CLUB_SLUG = 'padel-central';

// Configuración de Horario de Atención Exacto (08:00 a 23:30 hs)
const MINUTOS_APERTURA = 8 * 60;        // 08:00 hs -> 480 min
const MINUTOS_CIERRE = 23 * 60 + 30;    // 23:30 hs -> 1410 min
const HORA_APERTURA_LABEL = "08:00";
const HORA_CIERRE_LABEL = "23:30";

// Helper para obtener fecha YYYY-MM-DD en hora local real (sin desfase UTC)
const obtenerFechaLocalISO = (fechaObj = new Date()) => {
  const anio = fechaObj.getFullYear();
  const mes = String(fechaObj.getMonth() + 1).padStart(2, '0');
  const dia = String(fechaObj.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

export default function App() {
  const [vistaAdmin, setVistaAdmin] = useState(false);
  const [estaAutenticado, setEstaAutenticado] = useState(false);
  const [mostrarModalLogin, setMostrarModalLogin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [errorLogin, setErrorLogin] = useState('');

  const [club, setClub] = useState(null);
  const [canchas, setCanchas] = useState([]);
  const [canchaSeleccionada, setCanchaSeleccionada] = useState(null);
  
  const hoyISO = obtenerFechaLocalISO(new Date());
  const [fecha, setFecha] = useState(hoyISO);
  
  const [slots, setSlots] = useState([]);
  const [slotSeleccionado, setSlotSeleccionado] = useState(null);
  
  // Reservas admin & filtros
  const [reservasAdmin, setReservasAdmin] = useState([]);
  const [filtroCanchaAdmin, setFiltroCanchaAdmin] = useState('TODAS');

  // Modal para creación manual / fija de turnos Admin
  const [mostrarModalCrearAdmin, setMostrarModalCrearAdmin] = useState(false);
  const [adminCanchaId, setAdminCanchaId] = useState('');
  const [adminHoraInicio, setAdminHoraInicio] = useState('18:00:00');
  const [adminNombre, setAdminNombre] = useState('');
  const [adminTelefono, setAdminTelefono] = useState('');
  const [adminEsFijo, setAdminEsFijo] = useState(false);
  const [adminSemanas, setAdminSemanas] = useState(4);
  const [adminError, setAdminError] = useState('');

  // Modal para Bloqueos / Mantenimiento / Lluvia / Torneos
  const [mostrarModalBloqueo, setMostrarModalBloqueo] = useState(false);
  const [bloqueoCanchaId, setBloqueoCanchaId] = useState('0'); // '0' = Todas las canchas
  const [tipoBloqueoHorario, setTipoBloqueoHorario] = useState('DIA_COMPLETO'); // 'DIA_COMPLETO' | 'DESDE_HORA' | 'SOLO_TURNO'
  const [bloqueoHoraInicio, setBloqueoHoraInicio] = useState('18:00');
  const [bloqueoMotivo, setBloqueoMotivo] = useState('Torneo');
  const [bloqueoFecha, setBloqueoFecha] = useState(hoyISO);
  const [bloqueoError, setBloqueoError] = useState('');
  const [bloqueando, setBloqueando] = useState(false);

  // Formulario cliente & éxito
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [mensaje, setMensaje] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState(null);
  const [ultimaReservaExitosa, setUltimaReservaExitosa] = useState(null);

  // Validación de estado de atención en tiempo real (con horas y minutos exactos)
  const estaAbierto = useMemo(() => {
    const ahora = new Date();
    const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
    return minutosActuales >= MINUTOS_APERTURA && minutosActuales < MINUTOS_CIERRE;
  }, []);

  // Próximos 7 días (calculados en hora local exacta)
  const proximosDias = useMemo(() => {
    const lista = [];
    const nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const hoy = new Date();

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(hoy.getDate() + i);
      const fechaISO = obtenerFechaLocalISO(d);
      const diaSemana = nombresDias[d.getDay()];
      const diaNumero = d.getDate();
      const mes = meses[d.getMonth()];
      const etiqueta = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : `${diaSemana} ${diaNumero}`;

      lista.push({ fechaISO, etiqueta, diaNumero, diaSemana, mes });
    }
    return lista;
  }, []);

  // 1. Cargar info de club y canchas
  useEffect(() => {
    axios.get(`${API_BASE}/clubes/${CLUB_SLUG}`)
      .then(res => setClub(res.data))
      .catch(err => {
        console.error("Error cargando club", err);
        setErrorCarga("No se pudo conectar con el backend o no existe el club.");
      });

    axios.get(`${API_BASE}/clubes/${CLUB_SLUG}/canchas`)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setCanchas(data);
        if (data.length > 0) {
          setCanchaSeleccionada(data[0].id);
          setAdminCanchaId(data[0].id);
        }
      })
      .catch(err => console.error("Error canchas", err));
  }, []);

  // 2. Cargar slots cliente (solo si el club está abierto)
  useEffect(() => {
    if (!vistaAdmin && canchaSeleccionada && fecha && estaAbierto) {
      cargarSlots();
    }
  }, [canchaSeleccionada, fecha, vistaAdmin, estaAbierto]);

  // 3. Cargar reservas admin
  useEffect(() => {
    if (vistaAdmin && estaAutenticado && club?.id && fecha) {
      cargarReservasAdmin();
    }
  }, [vistaAdmin, estaAutenticado, fecha, club]);

  const cargarSlots = () => {
    axios.get(`${API_BASE}/reservas/disponibilidad?canchaId=${canchaSeleccionada}&fecha=${fecha}`)
      .then(res => {
        setSlots(Array.isArray(res.data) ? res.data : []);
        setSlotSeleccionado(null);
      })
      .catch(() => setSlots([]));
  };

  const cargarReservasAdmin = () => {
    axios.get(`${API_BASE}/reservas/admin?clubId=${club.id}&fecha=${fecha}`)
      .then(res => setReservasAdmin(Array.isArray(res.data) ? res.data : []))
      .catch(() => setReservasAdmin([]));
  };

  const handleAccesoAdmin = () => {
    if (estaAutenticado) {
      setVistaAdmin(true);
    } else {
      setMostrarModalLogin(true);
      setErrorLogin('');
      setPinInput('');
    }
  };

  const handleVerificarPin = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/clubes/${CLUB_SLUG}/login-admin`, { pin: pinInput });
      setEstaAutenticado(true);
      setMostrarModalLogin(false);
      setVistaAdmin(true);
    } catch {
      setErrorLogin('Contraseña incorrecta');
    }
  };

  const handleCerrarSesion = () => {
    setEstaAutenticado(false);
    setVistaAdmin(false);
  };

  // Reserva de cliente
  const handleReservar = async (e) => {
    e.preventDefault();
    if (!estaAbierto) {
      alert('El complejo se encuentra cerrado en este momento.');
      return;
    }
    if (!slotSeleccionado || !nombre || !telefono) return;
    setCargando(true);
    setMensaje(null);

    const canchaObj = canchas.find(c => c.id === canchaSeleccionada);

    try {
      await axios.post(`${API_BASE}/reservas`, {
        canchaId: canchaSeleccionada,
        fecha,
        horaInicio: slotSeleccionado.horaInicio,
        nombreCliente: nombre,
        telefonoCliente: telefono
      });

      setUltimaReservaExitosa({
        canchaNombre: canchaObj ? canchaObj.nombre : 'Cancha',
        fecha,
        horaInicio: slotSeleccionado.horaInicio,
        nombre,
        telefono
      });

      setMensaje({ tipo: 'exito', texto: '¡Turno reservado con éxito en el sistema!' });
      cargarSlots();
      setNombre('');
      setTelefono('');
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data || 'Error al reservar' });
    } finally {
      setCargando(false);
    }
  };

  // Enviar comprobante por WhatsApp
  const handleEnviarWhatsApp = () => {
    if (!ultimaReservaExitosa || !club) return;

    const lineas = [
      `¡Hola ${club.nombre}! 👋 Acabo de reservar un turno por la web:`,
      ``,
      `🎾 Cancha: ${ultimaReservaExitosa.canchaNombre}`,
      `📅 Fecha: ${ultimaReservaExitosa.fecha}`,
      `⏰ Horario: ${ultimaReservaExitosa.horaInicio?.slice(0, 5)} hs`,
      `👤 Cliente: ${ultimaReservaExitosa.nombre}`,
      `📱 Teléfono: ${ultimaReservaExitosa.telefono}`,
      ``,
      `¿Me confirman la reserva? ¡Muchas gracias!`
    ];

    const textoCompleto = lineas.join('\n');
    const numeroLimpio = (club.telefono || '2494641010').replace(/\D/g, '');
    const telefonoWhatsApp = numeroLimpio.startsWith('549') ? numeroLimpio : `549${numeroLimpio}`;
    const url = `https://api.whatsapp.com/send?phone=${telefonoWhatsApp}&text=${encodeURIComponent(textoCompleto)}`;
    
    window.open(url, '_blank');
  };

  // Cancelar turno o desbloquear desde Admin
  const handleCancelarReserva = async (id) => {
    if (!confirm('¿Seguro que deseas liberar este turno / bloqueo?')) return;
    try {
      await axios.patch(`${API_BASE}/reservas/${id}/cancelar`);
      cargarReservasAdmin();
    } catch {
      alert('Error al liberar el turno');
    }
  };

  // Crear turno simple o turno fijo desde Admin
  const handleCrearTurnoAdmin = async (e) => {
    e.preventDefault();
    setAdminError('');

    const horaFormateada = adminHoraInicio.length === 5 ? `${adminHoraInicio}:00` : adminHoraInicio;
    const telefonoFinal = adminTelefono.trim() || 'Sin teléfono';

    try {
      if (adminEsFijo) {
        await axios.post(`${API_BASE}/reservas/fija`, {
          canchaId: Number(adminCanchaId),
          fechaInicio: fecha,
          horaInicio: horaFormateada,
          nombreCliente: adminNombre,
          telefonoCliente: telefonoFinal,
          semanas: Number(adminSemanas)
        });
      } else {
        await axios.post(`${API_BASE}/reservas`, {
          canchaId: Number(adminCanchaId),
          fecha,
          horaInicio: horaFormateada,
          nombreCliente: adminNombre,
          telefonoCliente: telefonoFinal
        });
      }

      setMostrarModalCrearAdmin(false);
      setAdminNombre('');
      setAdminTelefono('');
      setAdminEsFijo(false);
      cargarReservasAdmin();
    } catch (err) {
      setAdminError(typeof err.response?.data === 'string' ? err.response.data : 'Error al crear el turno');
    }
  };

  // Bloquear Cancha / Día completo / Desde hora seleccionada
  const handleBloquearTurnos = async (e) => {
    e.preventDefault();
    setBloqueoError('');
    setBloqueando(true);

    const esDiaCompleto = tipoBloqueoHorario === 'DIA_COMPLETO';
    const esHastaElCierre = tipoBloqueoHorario === 'DESDE_HORA';
    const horaParam = esDiaCompleto ? null : (bloqueoHoraInicio.length === 5 ? `${bloqueoHoraInicio}:00` : bloqueoHoraInicio);
    const canchaParam = (!bloqueoCanchaId || bloqueoCanchaId === '0') ? null : Number(bloqueoCanchaId);

    try {
      await axios.post(`${API_BASE}/reservas/bloqueos`, {
        canchaId: canchaParam,
        clubId: club?.id,
        fecha: bloqueoFecha,
        horaInicio: horaParam,
        hastaElCierre: esHastaElCierre,
        motivo: bloqueoMotivo
      });

      setMostrarModalBloqueo(false);
      setFecha(bloqueoFecha);
      cargarReservasAdmin();
    } catch (err) {
      setBloqueoError(typeof err.response?.data === 'string' ? err.response.data : 'Error al bloquear turnos');
    } finally {
      setBloqueando(false);
    }
  };

  // Filtrado de reservas para el Admin
  const reservasAdminFiltradas = filtroCanchaAdmin === 'TODAS'
    ? reservasAdmin
    : reservasAdmin.filter(r => r.cancha?.id === Number(filtroCanchaAdmin));

  if (errorCarga) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-rose-800 text-rose-300 p-6 rounded-2xl max-w-md text-center shadow-2xl">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="font-semibold mb-1">Error de conexión</p>
          <p className="text-sm text-zinc-400">{errorCarga}</p>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 font-medium">
        Cargando complejo...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-zinc-950 overflow-x-hidden">
      
      {/* 🎾 FONDO DE PANTALLA AJUSTADO CON FUNDIDO INFERIOR */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-zinc-950">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-100"
          style={{ backgroundImage: `url(${FONDO})` }}
        />
        {/* Degradado para fundir el borde inferior suavemente con el fondo general */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/35 to-zinc-950" />
      </div>

      {/* Contenedor principal */}
      <div className="relative z-10 p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        
        {/* Barra superior */}
        <header className="flex items-center justify-between bg-zinc-900/80 border border-zinc-800 backdrop-blur-md p-5 rounded-3xl shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">{club.nombre}</h1>
                {estaAbierto ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Abierto
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Cerrado
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                <MapPin className="w-3 h-3 text-zinc-500" /> {club.direccion} • <Phone className="w-3 h-3 text-zinc-500" /> {club.telefono}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {vistaAdmin ? (
              <>
                <button
                  onClick={() => setVistaAdmin(false)}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-semibold bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-200 transition"
                >
                  <User className="w-4 h-4 text-emerald-400" /> Vista Jugador
                </button>
                <button
                  onClick={handleCerrarSesion}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition"
                >
                  <LogOut className="w-4 h-4" /> Salir
                </button>
              </>
            ) : (
              <button
                onClick={handleAccesoAdmin}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-zinc-900 border border-zinc-700 hover:border-emerald-500/60 text-zinc-300 hover:text-white transition shadow-md"
              >
                <Lock className="w-4 h-4 text-emerald-400" /> Admin
              </button>
            )}
          </div>
        </header>

        {/* Modal de Login Admin (Limpio sin oscurecimiento invasivo) */}
        {mostrarModalLogin && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Acceso Administrador</h3>
                  <p className="text-xs text-zinc-400">Ingresá la contraseña del complejo</p>
                </div>
              </div>

              <form onSubmit={handleVerificarPin} className="space-y-3">
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                  autoFocus
                />
                {errorLogin && <p className="text-xs text-rose-400 font-medium">{errorLogin}</p>}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMostrarModalLogin(false)}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-3 rounded-2xl text-xs transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold py-3 rounded-2xl text-xs shadow-lg shadow-emerald-500/20 transition"
                  >
                    Ingresar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Carga Manual / Turno Fijo */}
        {mostrarModalCrearAdmin && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
                  <PlusCircle className="w-5 h-5" /> Cargar Turno
                </div>
                <button 
                  onClick={() => setMostrarModalCrearAdmin(false)}
                  className="p-1 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {adminError && (
                <div className="p-3 rounded-2xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{adminError}</span>
                </div>
              )}

              <form onSubmit={handleCrearTurnoAdmin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Cancha</label>
                  <select
                    value={adminCanchaId}
                    onChange={(e) => setAdminCanchaId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    {canchas.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Fecha</label>
                    <input
                      type="date"
                      value={fecha}
                      disabled
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl p-3.5 text-zinc-400 text-sm cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Hora Inicio</label>
                    <select
                      value={adminHoraInicio}
                      onChange={(e) => setAdminHoraInicio(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
                    >
                      {["08:00", "09:30", "11:00", "12:30", "14:00", "15:30", "17:00", "18:30", "20:00", "21:30", "23:00"].map((h) => (
                        <option key={h} value={`${h}:00`}>{h} hs</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Nombre / Grupo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Grupo Jueves / Juan Pérez"
                    value={adminNombre}
                    onChange={(e) => setAdminNombre(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Teléfono (Opcional)</label>
                  <input
                    type="tel"
                    placeholder="Ej: 2494112233"
                    value={adminTelefono}
                    onChange={(e) => setAdminTelefono(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 text-zinc-100 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Turno Fijo Recurrente */}
                <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-2xl space-y-3">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={adminEsFijo}
                      onChange={(e) => setAdminEsFijo(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500 bg-zinc-900"
                    />
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Repeat className="w-3.5 h-3.5" /> ¿Repetir como Turno Fijo Semanal?
                    </span>
                  </label>

                  {adminEsFijo && (
                    <div className="pt-2 border-t border-zinc-800 space-y-1.5">
                      <label className="block text-[11px] text-zinc-400 font-medium">Duración:</label>
                      <select
                        value={adminSemanas}
                        onChange={(e) => setAdminSemanas(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-zinc-100 text-xs focus:outline-none focus:border-emerald-500"
                      >
                        <option value={4}>4 semanas (1 mes hacia adelante)</option>
                        <option value={8}>8 semanas (2 meses hacia adelante)</option>
                        <option value={12}>12 semanas (3 meses hacia adelante)</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMostrarModalCrearAdmin(false)}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-3 rounded-2xl text-xs transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold py-3 rounded-2xl text-xs shadow-lg shadow-emerald-500/20 transition"
                  >
                    {adminEsFijo ? 'Crear Turno Fijo' : 'Registrar Turno'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Bloqueo / Mantenimiento / Torneos */}
        {mostrarModalBloqueo && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-lg">
                  <Ban className="w-5 h-5" /> Bloquear Pista / Día
                </div>
                <button 
                  onClick={() => setMostrarModalBloqueo(false)}
                  className="p-1 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {bloqueoError && (
                <div className="p-3 rounded-2xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{bloqueoError}</span>
                </div>
              )}

              <form onSubmit={handleBloquearTurnos} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Alcance de Pistas</label>
                  <select
                    value={bloqueoCanchaId}
                    onChange={(e) => setBloqueoCanchaId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 text-zinc-100 text-sm focus:outline-none focus:border-rose-500"
                  >
                    <option value="0">🚨 Todas las canchas (Complejo entero)</option>
                    {canchas.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Fecha a bloquear</label>
                  <input
                    type="date"
                    value={bloqueoFecha}
                    onChange={(e) => setBloqueoFecha(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 text-zinc-100 text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* Modo de Horario a Inhabilitar */}
                <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-2xl space-y-3">
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Rango de Horarios:
                  </label>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setTipoBloqueoHorario('DIA_COMPLETO')}
                      className={`p-2.5 rounded-xl border text-[11px] font-bold text-center transition ${
                        tipoBloqueoHorario === 'DIA_COMPLETO'
                          ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Día Completo
                    </button>

                    <button
                      type="button"
                      onClick={() => setTipoBloqueoHorario('DESDE_HORA')}
                      className={`p-2.5 rounded-xl border text-[11px] font-bold text-center transition ${
                        tipoBloqueoHorario === 'DESDE_HORA'
                          ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Desde hora en adelante
                    </button>

                    <button
                      type="button"
                      onClick={() => setTipoBloqueoHorario('SOLO_TURNO')}
                      className={`p-2.5 rounded-xl border text-[11px] font-bold text-center transition ${
                        tipoBloqueoHorario === 'SOLO_TURNO'
                          ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Solo 1 Turno
                    </button>
                  </div>

                  {tipoBloqueoHorario !== 'DIA_COMPLETO' && (
                    <div className="pt-2 border-t border-zinc-800 space-y-1.5">
                      <label className="block text-[11px] text-zinc-400 font-medium">
                        {tipoBloqueoHorario === 'DESDE_HORA' ? 'A partir de qué horario inhabilitar:' : 'Horario puntual a inhabilitar:'}
                      </label>
                      <select
                        value={bloqueoHoraInicio}
                        onChange={(e) => setBloqueoHoraInicio(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-zinc-100 text-xs focus:outline-none focus:border-rose-500"
                      >
                        {["08:00", "09:30", "11:00", "12:30", "14:00", "15:30", "17:00", "18:30", "20:00", "21:30", "23:00"].map((h) => (
                          <option key={h} value={h}>{h} hs</option>
                        ))}
                      </select>
                      {tipoBloqueoHorario === 'DESDE_HORA' && (
                        <p className="text-[10px] text-rose-300/80">
                          ℹ️ Se bloquearán todos los turnos desde las {bloqueoHoraInicio} hs hasta el cierre de la jornada.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Motivo del Bloqueo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Torneo Anual / Lluvia / Luces"
                    value={bloqueoMotivo}
                    onChange={(e) => setBloqueoMotivo(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 text-zinc-100 text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMostrarModalBloqueo(false)}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-3 rounded-2xl text-xs transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={bloqueando}
                    className="flex-1 bg-rose-500 hover:bg-rose-400 text-white font-bold py-3 rounded-2xl text-xs shadow-lg shadow-rose-500/20 transition disabled:opacity-50"
                  >
                    {bloqueando ? 'Bloqueando...' : 'Confirmar Bloqueo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ----------------- VISTA ADMINISTRADOR ----------------- */}
        {vistaAdmin && estaAutenticado ? (
          <main className="space-y-6">
            <div className="flex items-center justify-between bg-zinc-900/80 border border-zinc-800 backdrop-blur-md p-4 rounded-3xl shadow-xl">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Fecha de planilla:</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 backdrop-blur-md rounded-3xl p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-lg font-extrabold text-emerald-400 flex items-center gap-2">
                  <Shield className="w-5 h-5" /> Planilla Diaria de Turnos
                </h2>
                
                {/* Botones de acción admin */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setBloqueoError('');
                      setBloqueoFecha(fecha);
                      setMostrarModalBloqueo(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs rounded-2xl transition"
                  >
                    <Ban className="w-4 h-4" /> Bloquear Cancha / Día
                  </button>

                  <button
                    onClick={() => {
                      setAdminError('');
                      setMostrarModalCrearAdmin(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold text-xs rounded-2xl shadow-lg shadow-emerald-500/20 transition"
                  >
                    <PlusCircle className="w-4 h-4" /> Cargar Turno
                  </button>
                </div>
              </div>

              {/* Filtro por Cancha */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setFiltroCanchaAdmin('TODAS')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold border transition ${
                    filtroCanchaAdmin === 'TODAS'
                      ? 'bg-emerald-400 text-zinc-950 border-emerald-300 shadow-md shadow-emerald-500/20'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  Todas ({reservasAdmin.length})
                </button>
                {canchas.map(c => {
                  const totalEnCancha = reservasAdmin.filter(r => r.cancha?.id === c.id).length;
                  const isSelected = filtroCanchaAdmin === String(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => setFiltroCanchaAdmin(String(c.id))}
                      className={`px-4 py-2 rounded-2xl text-xs font-bold border whitespace-nowrap transition ${
                        isSelected
                          ? 'bg-emerald-400 text-zinc-950 border-emerald-300 shadow-md shadow-emerald-500/20'
                          : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                      }`}
                    >
                      {c.nombre} ({totalEnCancha})
                    </button>
                  );
                })}
              </div>

              {reservasAdminFiltradas.length === 0 ? (
                <p className="text-sm text-zinc-500 py-10 text-center font-medium">No hay reservas ni bloqueos para los criterios seleccionados.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider">
                        <th className="pb-3 px-2">Cancha</th>
                        <th className="pb-3 px-2">Horario</th>
                        <th className="pb-3 px-2">Cliente / Motivo</th>
                        <th className="pb-3 px-2">Teléfono</th>
                        <th className="pb-3 px-2">Estado</th>
                        <th className="pb-3 px-2 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {reservasAdminFiltradas.map((reserva) => {
                        const esBloqueado = reserva.estado === 'BLOQUEADO';
                        return (
                          <tr key={reserva.id} className="hover:bg-zinc-950/40 transition">
                            <td className="py-3.5 px-2 font-semibold text-emerald-400">
                              {reserva.cancha?.nombre || 'Cancha'}
                            </td>
                            <td className="py-3.5 px-2 font-bold text-white">
                              {reserva.horaInicio?.slice(0, 5)} - {reserva.horaFin?.slice(0, 5)} hs
                            </td>
                            <td className={`py-3.5 px-2 font-medium ${esBloqueado ? 'text-rose-300' : 'text-zinc-200'}`}>
                              {reserva.nombreCliente}
                            </td>
                            <td className="py-3.5 px-2 text-zinc-400 text-xs">{reserva.telefonoCliente}</td>
                            <td className="py-3.5 px-2">
                              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                esBloqueado
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : reserva.estado === 'CONFIRMADO' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                              }`}>
                                {reserva.estado}
                              </span>
                            </td>
                            <td className="py-3.5 px-2 text-right">
                              {reserva.estado !== 'CANCELADO' && (
                                <button
                                  onClick={() => handleCancelarReserva(reserva.id)}
                                  className="text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-xl font-semibold transition"
                                >
                                  {esBloqueado ? 'Desbloquear' : 'Liberar'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </main>
        ) : (
          /* ----------------- VISTA CLIENTE ----------------- */
          <main className="space-y-6">
            
            {/* Si el club está CERRADO */}
            {!estaAbierto ? (
              <section className="bg-zinc-900/90 border border-amber-500/30 backdrop-blur-md rounded-3xl p-8 text-center space-y-4 shadow-2xl">
                <div className="w-14 h-14 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
                  <Moon className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-white">Complejo Cerrado por Descanso</h2>
                  <p className="text-sm text-zinc-400 max-w-md mx-auto">
                    Nuestro horario de atención y reservas es de <span className="text-white font-bold">{HORA_APERTURA_LABEL} hs</span> a <span className="text-white font-bold">{HORA_CIERRE_LABEL} hs</span>.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-semibold">
                  <Clock className="w-4 h-4 text-amber-400" />
                  El sistema se habilitará automáticamente a las {HORA_APERTURA_LABEL} hs.
                </div>
              </section>
            ) : (
              /* Si el club está ABIERTO */
              <>
                {/* Mensaje de Confirmación / WhatsApp */}
                {mensaje && (
                  <div className={`p-6 rounded-3xl border backdrop-blur-md shadow-2xl space-y-4 ${
                    mensaje.tipo === 'exito' 
                      ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200' 
                      : 'bg-rose-950/70 border-rose-800 text-rose-300'
                  }`}>
                    <div className="flex items-center gap-3">
                      {mensaje.tipo === 'exito' ? <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-emerald-400" /> : <AlertCircle className="w-6 h-6 flex-shrink-0 text-rose-400" />}
                      <p className="text-sm font-bold text-white">{mensaje.texto}</p>
                    </div>

                    {mensaje.tipo === 'exito' && ultimaReservaExitosa && (
                      <div className="pt-3 border-t border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <p className="text-xs text-emerald-300/80">
                          Enviá el comprobante al club para validar tu turno de forma inmediata.
                        </p>
                        <button
                          onClick={handleEnviarWhatsApp}
                          className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-500/30 transition"
                        >
                          <MessageCircle className="w-4 h-4 fill-current" />
                          Enviar por WhatsApp
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Selector de Días Semanales */}
                <section className="bg-zinc-900/80 border border-zinc-800 backdrop-blur-md rounded-3xl p-5 md:p-6 space-y-3.5 shadow-xl">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-400" /> 1. Elegí el día de tu partido
                  </label>
                  
                  <div className="grid grid-cols-3 sm:grid-cols-7 gap-2.5">
                    {proximosDias.map((d) => {
                      const isSelected = fecha === d.fechaISO;
                      return (
                        <button
                          key={d.fechaISO}
                          onClick={() => setFecha(d.fechaISO)}
                          className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center justify-center ${
                            isSelected
                              ? 'border-emerald-400 bg-emerald-400 text-zinc-950 font-black shadow-lg shadow-emerald-500/25'
                              : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 text-zinc-300'
                          }`}
                        >
                          <span className={`text-[10px] uppercase tracking-wider font-bold ${isSelected ? 'text-zinc-950' : 'text-zinc-400'}`}>
                            {d.etiqueta}
                          </span>
                          <span className="text-lg font-black mt-0.5 tracking-tight">
                            {d.diaNumero}
                          </span>
                          <span className={`text-[10px] font-semibold ${isSelected ? 'text-zinc-900' : 'text-zinc-500'}`}>
                            {d.mes}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Selector de Canchas */}
                <section className="bg-zinc-900/80 border border-zinc-800 backdrop-blur-md rounded-3xl p-5 md:p-6 space-y-3.5 shadow-xl">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">2. Seleccioná la pista</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {canchas.map(c => {
                      const isSelected = canchaSeleccionada === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setCanchaSeleccionada(c.id)}
                          className={`p-4 rounded-2xl border text-left transition flex items-center justify-between ${
                            isSelected 
                              ? 'border-emerald-500/80 bg-emerald-500/10 text-emerald-300 font-bold shadow-lg' 
                              : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 text-zinc-300'
                          }`}
                        >
                          <div>
                            <p className="text-white font-bold text-sm md:text-base">{c.nombre}</p>
                            <p className="text-xs text-zinc-400 mt-0.5">{c.tipo || 'Pista Profesional'}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400">
                              ${c.precioBase}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Horarios Disponibles */}
                <section className="bg-zinc-900/80 border border-zinc-800 backdrop-blur-md rounded-3xl p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-extrabold flex items-center gap-2 text-white">
                      <Clock className="w-5 h-5 text-emerald-400" /> 3. Horarios Disponibles (90 min)
                    </h2>
                    <span className="text-xs text-zinc-400 font-medium">Turnos estándar</span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {slots.map((slot, idx) => {
                      const isSelected = slotSeleccionado?.horaInicio === slot.horaInicio;
                      return (
                        <button
                          key={idx}
                          disabled={!slot.disponible}
                          onClick={() => setSlotSeleccionado(slot)}
                          className={`p-3.5 rounded-2xl border text-center font-bold transition ${
                            !slot.disponible
                              ? 'bg-zinc-950/40 border-zinc-900 text-zinc-600 line-through cursor-not-allowed opacity-50'
                              : isSelected
                              ? 'bg-emerald-400 text-zinc-950 border-emerald-300 font-black shadow-lg shadow-emerald-500/25'
                              : 'bg-zinc-950/70 border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900 text-zinc-200'
                          }`}
                        >
                          <span className="text-sm">{slot.horaInicio?.slice(0, 5)} hs</span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Formulario de Confirmación */}
                {slotSeleccionado && (
                  <form onSubmit={handleReservar} className="bg-zinc-900/90 border border-emerald-500/40 rounded-3xl p-6 space-y-4 shadow-2xl backdrop-blur-md">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                      <div>
                        <h3 className="font-extrabold text-white text-base">Completá tus datos para jugar</h3>
                        <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                          Turno seleccionado: {slotSeleccionado.horaInicio?.slice(0, 5)} hs
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Nombre y Apellido</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: Juan Pérez"
                          value={nombre}
                          onChange={(e) => setNombre(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 text-zinc-100 text-sm focus:outline-none focus:border-emerald-400 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">WhatsApp / Teléfono</label>
                        <input
                          type="tel"
                          required
                          placeholder="Ej: 2494123456"
                          value={telefono}
                          onChange={(e) => setTelefono(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 text-zinc-100 text-sm focus:outline-none focus:border-emerald-400 transition"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={cargando}
                      className="w-full bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-black text-sm uppercase tracking-wider py-4 px-4 rounded-2xl shadow-lg shadow-emerald-500/25 transition disabled:opacity-50 mt-2"
                    >
                      {cargando ? 'Registrando turno...' : 'Confirmar Reserva Ahora'}
                    </button>
                  </form>
                )}
              </>
            )}
          </main>
        )}

      </div>
    </div>
  );
}