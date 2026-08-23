import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Moon, 
  Eye, 
  EyeOff,
  RefreshCw,
  Info
} from 'lucide-react';

import FONDO from './assets/FONDO.jpg.avif';

const API_BASE = import.meta.env.VITE_API_URL || 'http://192.168.1.41:8080/api/v1';
const CLUB_SLUG = 'padel-central';

const MINUTOS_APERTURA = 8 * 60;          // 08:00 hs
const MINUTOS_CIERRE = 23 * 60 + 30;      // 23:30 hs
const HORA_APERTURA_LABEL = "08:00";
const HORA_CIERRE_LABEL = "23:30";

const obtenerFechaLocalISO = (fechaObj = new Date()) => {
  const anio = fechaObj.getFullYear();
  const mes = String(fechaObj.getMonth() + 1).padStart(2, '0');
  const dia = String(fechaObj.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

// Componente visual de carga animado con temática de Pádel
function PadelLoader({ texto = "Cargando complejo..." }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <style>{`
        @keyframes fillUp {
          0% { height: 0%; y: 100px; }
          50% { height: 100%; y: 0px; }
          100% { height: 0%; y: 100px; }
        }
        @keyframes padelHit {
          0%, 100% { transform: rotate(-8deg) translateY(0); }
          50% { transform: rotate(-14deg) translateY(-4px); }
        }
        @keyframes ballBounce {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-18px, -28px) scale(0.9); }
        }
        .anim-fill-rect {
          animation: fillUp 2.4s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
        }
        .anim-padel {
          animation: padelHit 1.2s ease-in-out infinite;
          transform-origin: 50% 80%;
        }
        .anim-ball-bounce {
          animation: ballBounce 1.2s ease-in-out infinite;
        }
      `}</style>

      <div className="relative w-28 h-28 flex items-center justify-center">
        <div className="absolute w-20 h-20 rounded-full bg-emerald-500/20 blur-xl pointer-events-none" />

        <svg viewBox="0 0 100 100" className="w-24 h-24 anim-padel filter drop-shadow-[0_0_14px_rgba(52,211,153,0.4)] overflow-visible">
          <defs>
            <clipPath id="loader-fill-clip">
              <rect className="anim-fill-rect" x="0" y="0" width="100" height="100" />
            </clipPath>

            <mask id="padel-holes-mask">
              <rect x="0" y="0" width="100" height="100" fill="white" />
              <circle cx="43" cy="36" r="2.8" fill="black" />
              <circle cx="50" cy="36" r="2.8" fill="black" />
              <circle cx="57" cy="36" r="2.8" fill="black" />
              <circle cx="39" cy="46" r="2.8" fill="black" />
              <circle cx="46.5" cy="46" r="2.8" fill="black" />
              <circle cx="53.5" cy="46" r="2.8" fill="black" />
              <circle cx="61" cy="46" r="2.8" fill="black" />
              <circle cx="43" cy="56" r="2.8" fill="black" />
              <circle cx="50" cy="56" r="2.8" fill="black" />
              <circle cx="57" cy="56" r="2.8" fill="black" />
            </mask>
          </defs>

          <g mask="url(#padel-holes-mask)">
            <rect x="46" y="68" width="8" height="24" rx="4" fill="#27272a" stroke="#3f3f46" strokeWidth="1.5" />
            <path d="M 50 14 C 30 14, 25 28, 25 46 C 25 64, 38 70, 50 70 C 62 70, 75 64, 75 46 C 75 28, 70 14, 50 14 Z" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
          </g>

          <g clipPath="url(#loader-fill-clip)" mask="url(#padel-holes-mask)">
            <rect x="46" y="68" width="8" height="24" rx="4" fill="#10b981" />
            <path d="M 50 14 C 30 14, 25 28, 25 46 C 25 64, 38 70, 50 70 C 62 70, 75 64, 75 46 C 75 28, 70 14, 50 14 Z" fill="#34d399" />
          </g>
        </svg>

        <div className="absolute right-2 top-3 w-4 h-4 rounded-full bg-[#ccff00] shadow-[0_0_12px_rgba(204,255,0,0.9)] border border-lime-300 anim-ball-bounce z-10" />
      </div>

      <p className="mt-5 text-xs sm:text-sm font-bold tracking-wider text-emerald-400 uppercase animate-pulse">
        {texto}
      </p>
    </div>
  );
}

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
  
  const [reservasAdmin, setReservasAdmin] = useState([]);
  const [filtroCanchaAdmin, setFiltroCanchaAdmin] = useState('TODAS');
  const [ocultarCancelados, setOcultarCancelados] = useState(true);

  // Modal para creación manual / fija de turnos Admin
  const [mostrarModalCrearAdmin, setMostrarModalCrearAdmin] = useState(false);
  const [adminCanchaId, setAdminCanchaId] = useState('');
  const [adminFecha, setAdminFecha] = useState(hoyISO);
  const [adminHoraInicio, setAdminHoraInicio] = useState('18:00:00');
  const [adminNombre, setAdminNombre] = useState('');
  const [adminTelefono, setAdminTelefono] = useState('');
  const [adminEsFijo, setAdminEsFijo] = useState(false);
  const [adminSemanas, setAdminSemanas] = useState(4);
  const [adminError, setAdminError] = useState('');

  // Modal para Bloqueos / Mantenimiento / Lluvia / Torneos
  const [mostrarModalBloqueo, setMostrarModalBloqueo] = useState(false);
  const [bloqueoCanchaId, setBloqueoCanchaId] = useState('0');
  const [tipoBloqueoHorario, setTipoBloqueoHorario] = useState('DIA_COMPLETO');
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

  // Modal de confirmación obligatoria WhatsApp
  const [mostrarModalConfirmacionWA, setMostrarModalConfirmacionWA] = useState(false);

  // Auto-limpiar el cartel a los 30 segundos si no lo cierran
  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => {
        setMensaje(null);
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  const manejarCambioNombre = (valor) => {
    const filtrado = valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    setNombre(filtrado);
  };

  const manejarCambioTelefono = (valor) => {
    const filtrado = valor.replace(/\D/g, '');
    setTelefono(filtrado);
  };

  const estaAbierto = useMemo(() => {
    const ahora = new Date();
    const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
    return minutosActuales >= MINUTOS_APERTURA && minutosActuales < MINUTOS_CIERRE;
  }, []);

  const proximosDias = useMemo(() => {
    const lista = [];
    const nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const hoy = new Date();

    for (let i = 0; i < 8; i++) {
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

  useEffect(() => {
    const peticionClub = axios.get(`${API_BASE}/clubes/${CLUB_SLUG}`);
    const peticionCanchas = axios.get(`${API_BASE}/clubes/${CLUB_SLUG}/canchas`);
    const delayMinimo = new Promise(resolve => setTimeout(resolve, 1800));

    Promise.all([peticionClub, peticionCanchas, delayMinimo])
      .then(([resClub, resCanchas]) => {
        setClub(resClub.data);
        const data = Array.isArray(resCanchas.data) ? resCanchas.data : [];
        setCanchas(data);
        if (data.length > 0) {
          setCanchaSeleccionada(data[0].id);
          setAdminCanchaId(data[0].id);
        }
      })
      .catch(err => {
        console.error("Error al cargar la aplicación", err);
        setErrorCarga("No se pudo conectar con el backend o no existe el club.");
      });
  }, []);

  const cargarSlots = useCallback(() => {
    if (!canchaSeleccionada || !fecha) return;
    axios.get(`${API_BASE}/reservas/disponibilidad?canchaId=${canchaSeleccionada}&fecha=${fecha}`)
      .then(res => {
        const nuevosSlots = Array.isArray(res.data) ? res.data : [];
        setSlots(nuevosSlots);
        setSlotSeleccionado(prev => {
          if (!prev) return null;
          const sigueDisponible = nuevosSlots.some(s => s.horaInicio === prev.horaInicio && s.disponible);
          return sigueDisponible ? prev : null;
        });
      })
      .catch(() => setSlots([]));
  }, [canchaSeleccionada, fecha]);

  const cargarReservasAdmin = useCallback(() => {
    if (!club?.id || !fecha) return;
    axios.get(`${API_BASE}/reservas/admin?clubId=${club.id}&fecha=${fecha}`)
      .then(res => setReservasAdmin(Array.isArray(res.data) ? res.data : []))
      .catch(() => setReservasAdmin([]));
  }, [club?.id, fecha]);

  // Polling cada 12s para jugador
  useEffect(() => {
    if (!vistaAdmin && canchaSeleccionada && fecha && estaAbierto) {
      cargarSlots();
      const intervalId = setInterval(cargarSlots, 12000);
      return () => clearInterval(intervalId);
    }
  }, [canchaSeleccionada, fecha, vistaAdmin, estaAbierto, cargarSlots]);

  // Polling cada 12s para admin
  useEffect(() => {
    if (vistaAdmin && estaAutenticado && club?.id && fecha) {
      cargarReservasAdmin();
      const intervalId = setInterval(cargarReservasAdmin, 12000);
      return () => clearInterval(intervalId);
    }
  }, [vistaAdmin, estaAutenticado, fecha, club?.id, cargarReservasAdmin]);

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

  const handlePreReservar = (e) => {
    e.preventDefault();
    if (!estaAbierto) {
      alert('El complejo se encuentra cerrado en este momento.');
      return;
    }
    const nombreLimpio = nombre.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').trim();
    const telLimpio = telefono.replace(/\D/g, '').trim();

    if (!slotSeleccionado || !nombreLimpio || !telLimpio) {
      alert('Por favor, verificá tus datos ingresados.');
      return;
    }
    setNombre(nombreLimpio);
    setTelefono(telLimpio);
    setMostrarModalConfirmacionWA(true);
  };

  const handleConfirmarYEnviarWA = async () => {
    setCargando(true);

    const canchaObj = canchas.find(c => c.id === canchaSeleccionada);
    const canchaNombre = canchaObj ? canchaObj.nombre : 'Cancha';
    const nombreFinal = nombre.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').trim();
    const telFinal = telefono.replace(/\D/g, '').trim();

    const textoMensaje = 
`¡Hola ${club?.nombre || 'Padel Central'}! 👋
Acabo de reservar un turno por la web:

🎾 *Pista:* ${canchaNombre}
📅 *Fecha:* ${fecha}
⏰ *Horario:* ${slotSeleccionado.horaInicio?.slice(0, 5)} hs
👤 *Jugador:* ${nombreFinal}
📱 *Teléfono:* ${telFinal}

¿Me confirman la reserva? ¡Muchas gracias! ✨`;

    let num = (club?.telefono || '2494641010').replace(/\D/g, '');
    if (num.startsWith('0')) num = num.substring(1);
    if (num.includes('15') && num.length === 12) num = num.replace('15', '');

    let telefonoDestino = num;
    if (num.startsWith('549')) {
      telefonoDestino = num;
    } else if (num.startsWith('54')) {
      telefonoDestino = `549${num.substring(2)}`;
    } else {
      telefonoDestino = `549${num}`;
    }

    const textoEncoded = encodeURIComponent(textoMensaje);
    const schemeWhatsAppMobile = `whatsapp://send?phone=${telefonoDestino}&text=${textoEncoded}`;
    const urlWhatsAppWeb = `https://api.whatsapp.com/send?phone=${telefonoDestino}&text=${textoEncoded}`;

    try {
      await axios.post(`${API_BASE}/reservas`, {
        canchaId: canchaSeleccionada,
        fecha,
        horaInicio: slotSeleccionado.horaInicio,
        nombreCliente: nombreFinal,
        telefonoCliente: telFinal
      });

      setMensaje({ tipo: 'exito', texto: '¡Turno reservado con éxito! Nos vemos en la cancha.' });
      cargarSlots();
      setNombre('');
      setTelefono('');
      setSlotSeleccionado(null);

      const esMovil = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (esMovil) {
        window.location.href = schemeWhatsAppMobile;
        setTimeout(() => {
          setMostrarModalConfirmacionWA(false);
        }, 600);
      } else {
        window.open(urlWhatsAppWeb, '_blank');
        setMostrarModalConfirmacionWA(false);
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: typeof err.response?.data === 'string' ? err.response.data : 'Error al reservar el turno' });
      setMostrarModalConfirmacionWA(false);
    } finally {
      setCargando(false);
    }
  };

  const handleCancelarReserva = async (id) => {
    if (!confirm('¿Seguro que deseas liberar este turno / bloqueo?')) return;
    try {
      await axios.patch(`${API_BASE}/reservas/${id}/cancelar`);
      cargarReservasAdmin();
    } catch {
      alert('Error al liberar el turno');
    }
  };

  const handleCrearTurnoAdmin = async (e) => {
    e.preventDefault();
    setAdminError('');

    const horaFormateada = adminHoraInicio.length === 5 ? `${adminHoraInicio}:00` : adminHoraInicio;
    const nombreAdminFinal = adminNombre.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').trim() || 'Sin nombre';
    const telefonoFinal = adminTelefono.replace(/\D/g, '').trim() || 'Sin teléfono';

    try {
      if (adminEsFijo) {
        await axios.post(`${API_BASE}/reservas/fija`, {
          canchaId: Number(adminCanchaId),
          fechaInicio: adminFecha,
          horaInicio: horaFormateada,
          nombreCliente: nombreAdminFinal,
          telefonoCliente: telefonoFinal,
          semanas: Number(adminSemanas)
        });
      } else {
        await axios.post(`${API_BASE}/reservas`, {
          canchaId: Number(adminCanchaId),
          fecha: adminFecha,
          horaInicio: horaFormateada,
          nombreCliente: nombreAdminFinal,
          telefonoCliente: telefonoFinal
        });
      }

      setMostrarModalCrearAdmin(false);
      setAdminNombre('');
      setAdminTelefono('');
      setAdminEsFijo(false);

      if (fecha !== adminFecha) {
        setFecha(adminFecha);
      } else {
        cargarReservasAdmin();
      }
    } catch (err) {
      setAdminError(typeof err.response?.data === 'string' ? err.response.data : 'Error al crear el turno');
    }
  };

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

  const reservasAdminFiltradas = useMemo(() => {
    return reservasAdmin.filter(r => {
      const coincideCancha = filtroCanchaAdmin === 'TODAS' || r.cancha?.id === Number(filtroCanchaAdmin);
      const coincideEstado = ocultarCancelados ? r.estado !== 'CANCELADO' : true;
      return coincideCancha && coincideEstado;
    });
  }, [reservasAdmin, filtroCanchaAdmin, ocultarCancelados]);

  const canchaActualObj = canchas.find(c => c.id === canchaSeleccionada);

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
    return <PadelLoader texto="Cargando complejo..." />;
  }

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-zinc-950 overflow-x-hidden">
      
      {/* FONDO */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-zinc-950">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-100"
          style={{ backgroundImage: `url(${FONDO})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/35 to-zinc-950" />
      </div>

      <div className="relative z-10 p-3 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-4 md:space-y-6">
        
        {/* Barra superior */}
        <header className="flex items-center justify-between bg-zinc-900/80 border border-zinc-800 backdrop-blur-md p-4 sm:p-5 rounded-3xl shadow-xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 sm:p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-400 flex-shrink-0">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-2xl font-black tracking-tight text-white truncate leading-tight">
                {club.nombre}
              </h1>
              
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {estaAbierto ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Abierto
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Cerrado
                  </span>
                )}
                <span className="text-[11px] sm:text-xs text-zinc-400 flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 text-zinc-500 flex-shrink-0" /> {club.direccion}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {vistaAdmin ? (
              <>
                <button
                  onClick={() => setVistaAdmin(false)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-200 transition cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-emerald-400" /> <span className="hidden sm:inline">Vista</span> Jugador
                </button>
                <button
                  onClick={handleCerrarSesion}
                  className="flex items-center gap-1 px-2.5 py-2 rounded-2xl text-xs font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                  title="Cerrar sesión admin"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button
                onClick={handleAccesoAdmin}
                className="flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-xs font-bold bg-zinc-900 border border-zinc-700 hover:border-emerald-500/60 text-zinc-300 hover:text-white transition shadow-md cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400" /> Admin
              </button>
            )}
          </div>
        </header>

        {/* Modal Login Admin */}
        {mostrarModalLogin && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
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
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 text-white text-base sm:text-sm focus:outline-none focus:border-emerald-500 transition"
                  autoFocus
                />
                {errorLogin && <p className="text-xs text-rose-400 font-medium">{errorLogin}</p>}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMostrarModalLogin(false)}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-3 rounded-2xl text-xs transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold py-3 rounded-2xl text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                  >
                    Ingresar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Obligatorio WhatsApp */}
        {mostrarModalConfirmacionWA && slotSeleccionado && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-emerald-500/40 p-6 rounded-3xl max-w-md w-full space-y-5 shadow-2xl text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <MessageCircle className="w-7 h-7 fill-current" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-white">¡Último paso para tu turno!</h3>
                <p className="text-xs text-zinc-400">
                  Para asegurar la reserva, debés enviar el mensaje de confirmación al complejo.
                </p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-medium">Cancha:</span>
                  <span className="text-emerald-400 font-bold">{canchaActualObj?.nombre || 'Cancha'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-medium">Fecha:</span>
                  <span className="text-white font-bold">{fecha}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-medium">Horario:</span>
                  <span className="text-white font-bold">{slotSeleccionado.horaInicio?.slice(0, 5)} hs</span>
                </div>
                <div className="flex justify-between border-t border-zinc-800/80 pt-2">
                  <span className="text-zinc-500 font-medium">Jugador:</span>
                  <span className="text-zinc-200 font-semibold">{nombre} ({telefono})</span>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  disabled={cargando}
                  onClick={handleConfirmarYEnviarWA}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-black text-xs uppercase tracking-wider py-4 px-4 rounded-2xl shadow-xl shadow-emerald-500/25 transition disabled:opacity-50 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  {cargando ? 'Abriendo WhatsApp...' : 'Enviar Confirmación por WhatsApp'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                {!cargando && (
                  <button
                    type="button"
                    onClick={() => setMostrarModalConfirmacionWA(false)}
                    className="w-full text-zinc-500 hover:text-zinc-300 font-semibold text-xs py-2 transition cursor-pointer"
                  >
                    Modificar datos
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Crear Turno Admin */}
        {mostrarModalCrearAdmin && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-zinc-800 p-5 sm:p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-base sm:text-lg">
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
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3 text-zinc-100 text-base sm:text-sm focus:outline-none focus:border-emerald-500 appearance-none"
                  >
                    {canchas.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3">
                  <div className="w-full min-w-0">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Fecha del Turno</label>
                    <input
                      type="date"
                      value={adminFecha}
                      onChange={(e) => setAdminFecha(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3 text-zinc-100 text-base sm:text-sm focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
                    />
                  </div>
                  <div className="w-full min-w-0">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Hora Inicio</label>
                    <select
                      value={adminHoraInicio}
                      onChange={(e) => setAdminHoraInicio(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3 text-zinc-100 text-base sm:text-sm focus:outline-none focus:border-emerald-500 appearance-none"
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
                    inputMode="text"
                    placeholder="Ej: Grupo Jueves / Juan Pérez"
                    value={adminNombre}
                    onChange={(e) => setAdminNombre(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3 text-zinc-100 text-base sm:text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Teléfono (Opcional)</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Ej: 2494112233"
                    value={adminTelefono}
                    onChange={(e) => setAdminTelefono(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3 text-zinc-100 text-base sm:text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="bg-zinc-950/80 border border-zinc-800 p-3.5 rounded-2xl space-y-2.5">
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
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-zinc-100 text-base sm:text-xs focus:outline-none focus:border-emerald-500 appearance-none"
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
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-3 rounded-2xl text-xs transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold py-3 rounded-2xl text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                  >
                    {adminEsFijo ? 'Crear Turno Fijo' : 'Registrar Turno'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Bloqueo */}
        {mostrarModalBloqueo && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-zinc-800 p-5 sm:p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-base sm:text-lg">
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
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3 text-zinc-100 text-base sm:text-sm focus:outline-none focus:border-rose-500 appearance-none"
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
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3 text-zinc-100 text-base sm:text-sm focus:outline-none focus:border-rose-500 appearance-none"
                  />
                </div>

                <div className="bg-zinc-950/80 border border-zinc-800 p-3.5 rounded-2xl space-y-3">
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Rango de Horarios:
                  </label>
                  
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => setTipoBloqueoHorario('DIA_COMPLETO')}
                      className={`p-2 rounded-xl border text-[10px] sm:text-[11px] font-bold text-center transition cursor-pointer ${
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
                      className={`p-2 rounded-xl border text-[10px] sm:text-[11px] font-bold text-center transition cursor-pointer ${
                        tipoBloqueoHorario === 'DESDE_HORA'
                          ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Desde hora
                    </button>

                    <button
                      type="button"
                      onClick={() => setTipoBloqueoHorario('SOLO_TURNO')}
                      className={`p-2 rounded-xl border text-[10px] sm:text-[11px] font-bold text-center transition cursor-pointer ${
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
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-zinc-100 text-base sm:text-xs focus:outline-none focus:border-rose-500 appearance-none"
                      >
                        {["08:00", "09:30", "11:00", "12:30", "14:00", "15:30", "17:00", "18:30", "20:00", "21:30", "23:00"].map((h) => (
                          <option key={h} value={h}>{h} hs</option>
                        ))}
                      </select>
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
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3 text-zinc-100 text-base sm:text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 text-[11px] text-zinc-400 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    Se bloquearán los turnos libres. Los turnos ya reservados por clientes permanecerán intactos para que puedas avisarles antes de liberarlos.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMostrarModalBloqueo(false)}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-3 rounded-2xl text-xs transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={bloqueando}
                    className="flex-1 bg-rose-500 hover:bg-rose-400 text-white font-bold py-3 rounded-2xl text-xs shadow-lg shadow-rose-500/20 transition disabled:opacity-50 cursor-pointer"
                  >
                    {bloqueando ? 'Bloqueando...' : 'Confirmar Bloqueo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VISTA ADMIN */}
        {vistaAdmin && estaAutenticado ? (
          <main className="space-y-4 sm:space-y-6">
            <div className="bg-zinc-900/80 border border-zinc-800 backdrop-blur-md p-3.5 sm:p-4 rounded-3xl shadow-xl overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 flex-shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Fecha de planilla:
                </label>
                <div className="w-full sm:w-auto">
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-2xl px-3.5 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 text-base sm:text-sm cursor-pointer w-full sm:w-auto block appearance-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 backdrop-blur-md rounded-3xl p-4 sm:p-6 space-y-4 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-extrabold text-emerald-400 flex items-center gap-2">
                    <Shield className="w-5 h-5" /> Planilla Diaria
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <RefreshCw className="w-3 h-3 animate-spin" /> En vivo
                  </span>
                </div>
                
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setBloqueoError('');
                      setBloqueoFecha(fecha);
                      setMostrarModalBloqueo(true);
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs rounded-2xl transition cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" /> Bloquear
                  </button>

                  <button
                    onClick={() => {
                      setAdminError('');
                      setAdminFecha(fecha);
                      setMostrarModalCrearAdmin(true);
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold text-xs rounded-2xl shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Cargar Turno
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-1 min-w-0 scrollbar-none">
                  <button
                    onClick={() => setFiltroCanchaAdmin('TODAS')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer leading-none whitespace-nowrap flex-shrink-0 ${
                      filtroCanchaAdmin === 'TODAS'
                        ? 'bg-emerald-400 text-zinc-950 border-emerald-300 shadow-md shadow-emerald-500/20'
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                    }`}
                  >
                    <Filter className="w-3 h-3" />
                    Todas ({reservasAdmin.filter(r => ocultarCancelados ? r.estado !== 'CANCELADO' : true).length})
                  </button>
                  {canchas.map(c => {
                    const totalEnCancha = reservasAdmin.filter(r => 
                      r.cancha?.id === c.id && (ocultarCancelados ? r.estado !== 'CANCELADO' : true)
                    ).length;
                    const isSelected = filtroCanchaAdmin === String(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => setFiltroCanchaAdmin(String(c.id))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border whitespace-nowrap transition cursor-pointer leading-none flex-shrink-0 ${
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

                <button
                  onClick={() => setOcultarCancelados(!ocultarCancelados)}
                  className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border whitespace-nowrap transition cursor-pointer leading-none w-full sm:w-auto ${
                    !ocultarCancelados
                      ? 'bg-zinc-900 border-emerald-500/50 text-emerald-400'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {ocultarCancelados ? <EyeOff className="w-3.5 h-3.5 text-zinc-500" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>{ocultarCancelados ? 'Cancelados ocultos' : 'Cancelados visibles'}</span>
                </button>
              </div>

              {reservasAdminFiltradas.length === 0 ? (
                <p className="text-sm text-zinc-500 py-8 text-center font-medium">No hay reservas ni bloqueos para mostrar.</p>
              ) : (
                <>
                  {/* Vista Tarjetas para Celulares */}
                  <div className="grid grid-cols-1 gap-2.5 sm:hidden">
                    {reservasAdminFiltradas.map((reserva) => {
                      const esBloqueado = reserva.estado === 'BLOQUEADO';
                      return (
                        <div key={reserva.id} className="bg-zinc-950/70 border border-zinc-800/90 rounded-2xl p-3.5 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-sm text-emerald-400">
                              {reserva.cancha?.nombre || 'Cancha'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              esBloqueado
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : reserva.estado === 'CONFIRMADO' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                            }`}>
                              {reserva.estado}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 text-white font-black">
                              <Clock className="w-3.5 h-3.5 text-zinc-400" />
                              {reserva.horaInicio?.slice(0, 5)} - {reserva.horaFin?.slice(0, 5)} hs
                            </div>
                            <div className="text-zinc-400 truncate max-w-[140px] text-right">
                              {reserva.telefonoCliente}
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-zinc-800/80 pt-2 text-xs">
                            <div className={`font-medium truncate max-w-[170px] ${esBloqueado ? 'text-rose-300' : 'text-zinc-200'}`}>
                              {reserva.nombreCliente}
                            </div>
                            {reserva.estado !== 'CANCELADO' && (
                              <button
                                onClick={() => handleCancelarReserva(reserva.id)}
                                className="text-[11px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-xl font-bold transition cursor-pointer"
                              >
                                {esBloqueado ? 'Desbloquear' : 'Liberar'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Vista Tabla para Pantallas Medianas/Grandes */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider">
                          <th className="pb-3 px-2">Cancha</th>
                          <th className="pb-3 px-2 whitespace-nowrap">Horario</th>
                          <th className="pb-3 px-2">Cliente / Motivo</th>
                          <th className="pb-3 px-2 whitespace-nowrap">Teléfono</th>
                          <th className="pb-3 px-2">Estado</th>
                          <th className="pb-3 px-2 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {reservasAdminFiltradas.map((reserva) => {
                          const esBloqueado = reserva.estado === 'BLOQUEADO';
                          return (
                            <tr key={reserva.id} className="hover:bg-zinc-950/40 transition">
                              <td className="py-3.5 px-2 font-semibold text-emerald-400 whitespace-nowrap">
                                {reserva.cancha?.nombre || 'Cancha'}
                              </td>
                              <td className="py-3.5 px-2 font-bold text-white whitespace-nowrap">
                                {reserva.horaInicio?.slice(0, 5)} - {reserva.horaFin?.slice(0, 5)} hs
                              </td>
                              <td className={`py-3.5 px-2 font-medium ${esBloqueado ? 'text-rose-300' : 'text-zinc-200'}`}>
                                {reserva.nombreCliente}
                              </td>
                              <td className="py-3.5 px-2 text-zinc-400 text-xs whitespace-nowrap">{reserva.telefonoCliente}</td>
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
                              <td className="py-3.5 px-2 text-right whitespace-nowrap">
                                {reserva.estado !== 'CANCELADO' && (
                                  <button
                                    onClick={() => handleCancelarReserva(reserva.id)}
                                    className="text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer"
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
                </>
              )}
            </div>
          </main>
        ) : (
          /* VISTA CLIENTE */
          <main className="space-y-4 sm:space-y-6">
            {!estaAbierto ? (
              <section className="bg-zinc-900/90 border border-amber-500/30 backdrop-blur-md rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
                  <Moon className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg sm:text-xl font-black text-white">Complejo Cerrado por Descanso</h2>
                  <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
                    Nuestro horario de atención y reservas es de <span className="text-white font-bold">{HORA_APERTURA_LABEL} hs</span> a <span className="text-white font-bold">{HORA_CIERRE_LABEL} hs</span>.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-[11px] sm:text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  El sistema se habilitará automáticamente a las {HORA_APERTURA_LABEL} hs.
                </div>
              </section>
            ) : (
              <>
                {mensaje && (
                  <div className={`p-4 sm:p-5 rounded-3xl border backdrop-blur-md shadow-2xl flex items-center justify-between gap-3 animate-fade-in ${
                    mensaje.tipo === 'exito' 
                      ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200' 
                      : 'bg-rose-950/80 border-rose-800 text-rose-300'
                  }`}>
                    <div className="flex items-center gap-3">
                      {mensaje.tipo === 'exito' ? (
                        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 text-rose-400" />
                      )}
                      <p className="text-xs sm:text-sm font-bold text-white leading-snug">{mensaje.texto}</p>
                    </div>
                    <button
                      onClick={() => setMensaje(null)}
                      className="text-zinc-400 hover:text-white p-1 rounded-lg transition flex-shrink-0 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Selector de Días Semanales (8 Días) */}
                <section className="bg-zinc-900/80 border border-zinc-800 backdrop-blur-md rounded-3xl p-4 sm:p-6 space-y-3 shadow-xl">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-400" /> 1. Elegí el día de tu partido
                  </label>
                  
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 sm:gap-2">
                    {proximosDias.map((d) => {
                      const isSelected = fecha === d.fechaISO;
                      return (
                        <button
                          key={d.fechaISO}
                          onClick={() => setFecha(d.fechaISO)}
                          className={`p-2.5 sm:p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center cursor-pointer ${
                            isSelected
                              ? 'border-emerald-400 bg-emerald-400 text-zinc-950 font-black shadow-lg shadow-emerald-500/25'
                              : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 text-zinc-300'
                          }`}
                        >
                          <span className={`text-[9px] sm:text-[10px] uppercase tracking-wider font-bold ${isSelected ? 'text-zinc-950' : 'text-zinc-400'}`}>
                            {d.etiqueta}
                          </span>
                          <span className="text-base sm:text-lg font-black mt-0.5 tracking-tight">
                            {d.diaNumero}
                          </span>
                          <span className={`text-[9px] sm:text-[10px] font-semibold ${isSelected ? 'text-zinc-900' : 'text-zinc-500'}`}>
                            {d.mes}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Selector Canchas */}
                <section className="bg-zinc-900/80 border border-zinc-800 backdrop-blur-md rounded-3xl p-4 sm:p-6 space-y-3 shadow-xl">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">2. Seleccioná la cancha</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    {canchas.map(c => {
                      const isSelected = canchaSeleccionada === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setCanchaSeleccionada(c.id)}
                          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                            isSelected 
                              ? 'border-emerald-500/80 bg-emerald-500/10 text-emerald-300 font-bold shadow-lg' 
                              : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 text-zinc-300'
                          }`}
                        >
                          <div>
                            <p className="text-white font-bold text-sm sm:text-base">{c.nombre}</p>
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

                {/* Horarios */}
                <section className="bg-zinc-900/80 border border-zinc-800 backdrop-blur-md rounded-3xl p-4 sm:p-6 space-y-3.5 shadow-xl">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm sm:text-base font-extrabold flex items-center gap-2 text-white">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /> 3. Horarios Disponibles (90 min)
                    </h2>
                    <span className="text-[11px] sm:text-xs text-zinc-400 font-medium">Turnos estándar</span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                    {slots.map((slot, idx) => {
                      const isSelected = slotSeleccionado?.horaInicio === slot.horaInicio;
                      return (
                        <button
                          key={idx}
                          disabled={!slot.disponible}
                          onClick={() => setSlotSeleccionado(slot)}
                          className={`p-3 sm:p-3.5 rounded-2xl border text-center font-bold transition ${
                            !slot.disponible
                              ? 'bg-zinc-950/40 border-zinc-900 text-zinc-600 line-through cursor-not-allowed opacity-50'
                              : isSelected
                              ? 'bg-emerald-400 text-zinc-950 border-emerald-300 font-black shadow-lg shadow-emerald-500/25'
                              : 'bg-zinc-950/70 border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900 text-zinc-200 cursor-pointer'
                          }`}
                        >
                          <span className="text-xs sm:text-sm">{slot.horaInicio?.slice(0, 5)} hs</span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Formulario de Confirmación */}
                {slotSeleccionado && (
                  <form onSubmit={handlePreReservar} className="bg-zinc-900/90 border border-emerald-500/40 rounded-3xl p-4 sm:p-6 space-y-3.5 shadow-2xl backdrop-blur-md">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                      <div>
                        <h3 className="font-extrabold text-white text-sm sm:text-base">Completá tus datos para jugar</h3>
                        <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                          Turno seleccionado: {slotSeleccionado.horaInicio?.slice(0, 5)} hs
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Nombre y Apellido</label>
                        <input
                          type="text"
                          required
                          inputMode="text"
                          autoComplete="name"
                          placeholder="Ej: Juan Pérez"
                          value={nombre}
                          onChange={(e) => manejarCambioNombre(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3 text-zinc-100 text-base sm:text-sm focus:outline-none focus:border-emerald-400 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">WhatsApp / Teléfono</label>
                        <input
                          type="tel"
                          required
                          inputMode="numeric"
                          pattern="[0-9]*"
                          autoComplete="tel"
                          placeholder="Ej: 2494123456"
                          value={telefono}
                          onChange={(e) => manejarCambioTelefono(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3 text-zinc-100 text-base sm:text-sm focus:outline-none focus:border-emerald-400 transition"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-black text-xs sm:text-sm uppercase tracking-wider py-3.5 sm:py-4 px-4 rounded-2xl shadow-lg shadow-emerald-500/25 transition mt-2 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Continuar con la Reserva</span>
                      <ArrowRight className="w-4 h-4" />
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