import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  Info,
  Image as ImageIcon
} from 'lucide-react';

import FONDO from './assets/FONDO.jpg.avif';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
const CLUB_SLUG = 'padel-central';

const obtenerFechaLocalISO = (fechaObj = new Date()) => {
  const anio = fechaObj.getFullYear();
  const mes = String(fechaObj.getMonth() + 1).padStart(2, '0');
  const dia = String(fechaObj.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

const formatearFechaConDia = (fechaISO) => {
  if (!fechaISO) return '';
  const [anio, mes, dia] = fechaISO.split('-').map(Number);
  const dateObj = new Date(anio, mes - 1, dia);
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const diaSemana = dias[dateObj.getDay()];
  const diaFormateado = String(dia).padStart(2, '0');
  const mesFormateado = String(mes).padStart(2, '0');
  return `${diaSemana} ${diaFormateado}/${mesFormateado}/${anio}`;
};

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
  const [ocultarCancelados, setOcultarCancelados] = useState(true);

  // Modal para ver imagen de comprobante (Admin)
  const [imagenModalUrl, setImagenModalUrl] = useState(null);

  // Modales
  const [mostrarModalCrearAdmin, setMostrarModalCrearAdmin] = useState(false);
  const [adminCanchaId, setAdminCanchaId] = useState('');
  const [adminFecha, setAdminFecha] = useState(hoyISO);
  const [adminHoraInicio, setAdminHoraInicio] = useState('18:00:00');
  const [adminNombre, setAdminNombre] = useState('');
  const [adminTelefono, setAdminTelefono] = useState('');
  const [adminEsFijo, setAdminEsFijo] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminCanchaFijada, setAdminCanchaFijada] = useState(false);

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
  const [comprobanteArchivo, setComprobanteArchivo] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState(null);

  const [mostrarModalConfirmacionWA, setMostrarModalConfirmacionWA] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    if (slotSeleccionado && formRef.current) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [slotSeleccionado]);

  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => {
        setMensaje(null);
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

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
    const cargarDatos = async () => {
      try {
        const delayAnimacion = new Promise(resolve => setTimeout(resolve, 1200));

        const [resClub, resCanchas] = await Promise.all([
          axios.get(`${API_BASE}/clubes/${CLUB_SLUG}`),
          axios.get(`${API_BASE}/clubes/${CLUB_SLUG}/canchas`),
          delayAnimacion
        ]);

        setClub(resClub.data);

        const canchasRecibidas = Array.isArray(resCanchas.data) ? resCanchas.data : [];
        canchasRecibidas.sort((a, b) => Number(a.id) - Number(b.id));

        setCanchas(canchasRecibidas);

        if (canchasRecibidas.length > 0) {
          setCanchaSeleccionada(canchasRecibidas[0].id);
          setAdminCanchaId(canchasRecibidas[0].id);
        }
      } catch (err) {
        console.error("Error al cargar la aplicación", err);
        setErrorCarga("No se pudo conectar con el backend o no existe el club.");
      }
    };

    cargarDatos();
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
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setReservasAdmin(data);
      })
      .catch(() => setReservasAdmin([]));
  }, [club?.id, fecha]);

  useEffect(() => {
    if (!vistaAdmin && canchaSeleccionada && fecha) {
      cargarSlots();
      const intervalId = setInterval(cargarSlots, 12000);
      return () => clearInterval(intervalId);
    }
  }, [canchaSeleccionada, fecha, vistaAdmin, cargarSlots]);

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
    const nombreLimpio = nombre.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').trim();
    const telLimpio = telefono.replace(/\D/g, '').trim();

    if (!slotSeleccionado || !nombreLimpio || !telLimpio || !comprobanteArchivo) {
      alert('Por favor, completá todos los campos y adjuntá la captura del comprobante.');
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
`¡Hola ${club?.nombre || 'Murcielago Padel'}! 👋
Acabo de reservar un turno por la web:

🎾 *Cancha:* ${canchaNombre}
📅 *Fecha:* ${formatearFechaConDia(fecha)}
⏰ *Horario:* ${slotSeleccionado.horaInicio?.slice(0, 5)} hs
👤 *Jugador:* ${nombreFinal}
📱 *Teléfono:* ${telFinal}
🧾 *Comprobante:* Adjunto captura de pago

¡Muchas gracias! ✨`;

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
      const resReserva = await axios.post(`${API_BASE}/reservas`, {
        canchaId: canchaSeleccionada,
        fecha,
        horaInicio: slotSeleccionado.horaInicio,
        nombreCliente: nombreFinal,
        telefonoCliente: telFinal
      });

      const reservaId = resReserva.data?.id;
      
      if (reservaId && comprobanteArchivo) {
        const formData = new FormData();
        formData.append('file', comprobanteArchivo);

        await axios.put(`${API_BASE}/reservas/${reservaId}/confirmar-pago`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      setMensaje({ tipo: 'exito', texto: '¡Turno reservado y comprobante adjuntado con éxito! Nos vemos en la cancha.' });
      cargarSlots();
      setNombre('');
      setTelefono('');
      setComprobanteArchivo(null);
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
      setMensaje({ tipo: 'error', texto: typeof err.response?.data === 'string' ? err.response.data : 'Error al procesar la reserva' });
      setMostrarModalConfirmacionWA(false);
    } finally {
      setCargando(false);
    }
  };

  const handleCancelarReserva = async (id) => {
    if (!confirm('¿Seguro que deseas cancelar este turno puntual?')) return;
    try {
      await axios.patch(`${API_BASE}/reservas/${id}/cancelar`);
      cargarReservasAdmin();
    } catch {
      alert('Error al cancelar el turno');
    }
  };

  const handleCancelarCadena = async (id) => {
    if (!confirm('¿El cliente no viene más? Esto desfijará TODOS los turnos futuros de este horario fijo.')) return;
    try {
      await axios.patch(`${API_BASE}/reservas/${id}/cancelar-cadena`);
      cargarReservasAdmin();
    } catch {
      alert('Error al desfijar el turno');
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
          semanas: 52
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

  const canchasConReservas = useMemo(() => {
    return canchas.map(cancha => {
      const reservas = reservasAdmin
        .filter(r => (Number(r.cancha?.id) === Number(cancha.id) || Number(r.canchaId) === Number(cancha.id)) && (ocultarCancelados ? r.estado !== 'CANCELADO' : true))
        .sort((a, b) => (a.horaInicio || '').localeCompare(b.horaInicio || ''));
      return {
        ...cancha,
        reservas
      };
    });
  }, [canchas, reservasAdmin, ocultarCancelados]);

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

      <div className="relative z-10 p-3 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-4 md:space-y-6">
        
        {/* Barra superior */}
        <header className="flex items-center justify-between bg-zinc-900/95 border border-zinc-800 p-4 sm:p-5 rounded-3xl shadow-xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 sm:p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-400 flex-shrink-0">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-2xl font-black tracking-tight text-white truncate leading-tight">
                {club.nombre}
              </h1>
              
              <div className="flex items-center gap-2 mt-1 flex-wrap">
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

        {/* Modal de Imagen / Comprobante (Admin) */}
        {imagenModalUrl && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-zinc-700 p-4 rounded-3xl max-w-lg w-full space-y-4 shadow-2xl text-center">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-400" /> Comprobante de Transferencia
                </h3>
                <button 
                  onClick={() => setImagenModalUrl(null)}
                  className="p-1 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-zinc-950 p-2 rounded-2xl border border-zinc-800 max-h-[70vh] flex items-center justify-center overflow-hidden">
                <img 
                  src={imagenModalUrl} 
                  alt="Comprobante de pago" 
                  className="max-h-[60vh] object-contain rounded-xl"
                />
              </div>

              <button
                onClick={() => setImagenModalUrl(null)}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold py-3 rounded-2xl text-xs transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Modal Login Admin */}
        {mostrarModalLogin && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
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
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
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
                  <span className="text-white font-bold">{formatearFechaConDia(fecha)}</span>
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
                  {cargando ? 'Registrando y abriendo WhatsApp...' : 'Enviar Confirmación por WhatsApp'}
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
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
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
                  {adminCanchaFijada ? (
                    <div className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3 text-emerald-400 font-bold text-sm">
                      {canchas.find(c => String(c.id) === String(adminCanchaId))?.nombre || 'Cancha'}
                    </div>
                  ) : (
                    <select
                      value={adminCanchaId}
                      onChange={(e) => setAdminCanchaId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3 text-zinc-100 text-base sm:text-sm focus:outline-none focus:border-emerald-500 appearance-none"
                    >
                      {canchas.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  )}
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

                <div className="bg-zinc-950/80 border border-zinc-800 p-3.5 rounded-2xl space-y-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={adminEsFijo}
                      onChange={(e) => setAdminEsFijo(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500 bg-zinc-900"
                    />
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Repeat className="w-3.5 h-3.5" /> Turno Fijo
                    </span>
                  </label>
                  {adminEsFijo && (
                    <p className="text-[11px] text-zinc-400 pl-6 leading-snug">
                      Se repetirá automáticamente todas las semanas de forma indefinida hasta que se libere manualmente.
                    </p>
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
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-zinc-800 p-5 sm:p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-base sm:text-lg">
                  <Ban className="w-5 h-5" /> 
                  {bloqueoCanchaId === '0' ? 'Bloquear Complejo (Todas)' : 'Bloquear Cancha'}
                </div>
                <button 
                  onClick={() => setMostrarModalBloqueo(false)}
                  className="p-1 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {bloqueoError && (
                <div className="p-3 rounded-2xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{bloqueoError}</span>
                </div>
              )}

              <form onSubmit={handleBloquearTurnos} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Alcance del Bloqueo</label>
                  {bloqueoCanchaId === '0' ? (
                    <div className="w-full bg-zinc-950 border border-rose-500/30 rounded-2xl p-3 text-rose-400 font-black text-xs flex items-center gap-2">
                      <Ban className="w-4 h-4" /> 🚨 Todas las canchas (Bloqueo Complejo Entero)
                    </div>
                  ) : (
                    <div className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3 text-rose-400 font-bold text-sm">
                      {canchas.find(c => String(c.id) === String(bloqueoCanchaId))?.nombre || 'Cancha'} (Pista individual)
                    </div>
                  )}
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
            <div className="bg-zinc-900/95 border border-zinc-800 p-4 sm:p-5 rounded-3xl shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-400" /> Planilla Diaria
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <RefreshCw className="w-3 h-3 animate-spin" /> En vivo
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setBloqueoError('');
                      setBloqueoFecha(fecha);
                      setBloqueoCanchaId('0');
                      setMostrarModalBloqueo(true);
                    }}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs rounded-2xl transition cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" /> Bloquear Complejo
                  </button>

                  <button
                    onClick={() => {
                      setAdminError('');
                      setAdminFecha(fecha);
                      setAdminCanchaFijada(false);
                      setMostrarModalCrearAdmin(true);
                    }}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold text-xs rounded-2xl shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Cargar Turno
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Fecha de planilla:
                  </label>
                  
                  <div className="relative inline-flex items-center">
                    <span className="bg-zinc-950 border border-zinc-800 rounded-2xl px-3.5 py-1.5 text-zinc-100 text-xs sm:text-sm font-bold flex items-center gap-2 pointer-events-none">
                      {formatearFechaConDia(fecha)}
                    </span>
                    <input
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setOcultarCancelados(!ocultarCancelados)}
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    !ocultarCancelados
                      ? 'bg-zinc-900 border-emerald-500/50 text-emerald-400'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {ocultarCancelados ? <EyeOff className="w-3.5 h-3.5 text-zinc-500" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>{ocultarCancelados ? 'Cancelados ocultos' : 'Cancelados visibles'}</span>
                </button>
              </div>
            </div>

            {/* Grilla Visual 2x2 de Canchas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {canchasConReservas.map((cancha) => (
                <section 
                  key={cancha.id}
                  className="bg-zinc-900/95 border border-zinc-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div>
                      <h3 className="font-black text-white text-base sm:text-lg">
                        {cancha.nombre}
                      </h3>
                      <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                        {cancha.reservas.length} {cancha.reservas.length === 1 ? 'registro ocupado / bloqueado' : 'registros ocupados / bloqueados'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setAdminCanchaId(cancha.id);
                          setAdminCanchaFijada(true);
                          setAdminFecha(fecha);
                          setAdminError('');
                          setMostrarModalCrearAdmin(true);
                        }}
                        title="Cargar turno en esta cancha"
                        className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 text-zinc-300 hover:text-emerald-400 transition cursor-pointer text-xs flex items-center gap-1 font-semibold"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Turno
                      </button>

                      <button
                        onClick={() => {
                          setBloqueoCanchaId(String(cancha.id));
                          setBloqueoFecha(fecha);
                          setBloqueoError('');
                          setMostrarModalBloqueo(true);
                        }}
                        title="Bloquear esta cancha"
                        className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-rose-500/50 text-zinc-300 hover:text-rose-400 transition cursor-pointer text-xs flex items-center gap-1 font-semibold"
                      >
                        <Ban className="w-3.5 h-3.5" /> Bloquear
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5 flex-1 min-h-[160px]">
                    {cancha.reservas.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/40">
                        <Clock className="w-7 h-7 text-zinc-700 mb-1.5" />
                        <p className="text-xs font-semibold text-zinc-400">Sin reservas ni bloqueos para hoy</p>
                        <p className="text-[11px] text-zinc-600 mt-0.5">Todos los horarios se encuentran disponibles</p>
                      </div>
                    ) : (
                      cancha.reservas.map((reserva) => {
                        const esBloqueado = reserva.estado === 'BLOQUEADO';
                        const esCancelado = reserva.estado === 'CANCELADO';
                        const esFijo = reserva.nombreCliente?.includes('(Fijo)');

                        return (
                          <div
                            key={reserva.id}
                            className={`p-3.5 rounded-2xl border transition flex flex-col gap-3 ${
                              esBloqueado
                                ? 'bg-rose-950/20 border-rose-900/50 text-rose-200'
                                : esCancelado
                                ? 'bg-zinc-950/40 border-zinc-900 text-zinc-500 opacity-60'
                                : 'bg-zinc-950/70 border-zinc-800/90 text-zinc-200'
                            }`}
                          >
                            {/* Fila superior: Horario, Estado y Botones de acción */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-xs sm:text-sm text-white flex items-center gap-1.5">
                                  <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                  {reserva.horaInicio?.slice(0, 5)} - {reserva.horaFin?.slice(0, 5)} hs
                                </span>
                                
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                  esBloqueado
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                    : reserva.estado === 'CONFIRMADO'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                }`}>
                                  {reserva.estado}
                                </span>
                              </div>

                              {reserva.estado !== 'CANCELADO' && (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <button
                                    onClick={() => handleCancelarReserva(reserva.id)}
                                    className="text-[11px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer"
                                    title={esBloqueado ? 'Desbloquear' : 'Cancela únicamente este turno puntual'}
                                  >
                                    {esBloqueado ? 'Desbloquear' : 'Cancelar'}
                                  </button>

                                  {esFijo && (
                                    <button
                                      onClick={() => handleCancelarCadena(reserva.id)}
                                      className="text-[11px] bg-rose-900/40 hover:bg-rose-900/70 text-rose-300 border border-rose-700/50 px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer"
                                      title="Desfija y cancela todos los turnos futuros de este horario"
                                    >
                                      Desfijar Turno
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Fila inferior: Datos del Cliente / Grupo y Botón Ver Comprobante */}
                            <div className="text-xs flex items-center justify-between gap-2 text-zinc-300 border-t border-zinc-800/60 pt-2 flex-wrap">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="font-semibold truncate">
                                  {reserva.nombreCliente || 'Sin nombre'}
                                </span>
                                {reserva.telefonoCliente && (
                                  <span className="text-zinc-500 text-[11px] truncate">
                                    • {reserva.telefonoCliente}
                                  </span>
                                )}
                              </div>

                              {reserva.comprobanteImagen && (
                                <button
                                  onClick={() => setImagenModalUrl(`http://localhost:8080/uploads/${reserva.comprobanteImagen}`)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition cursor-pointer ml-auto"
                                >
                                  <ImageIcon className="w-3.5 h-3.5" /> Ver Comprobante
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>
              ))}
            </div>
          </main>
        ) : (
          /* VISTA CLIENTE */
          <main className="space-y-4 sm:space-y-6">
            {mensaje && (
              <div className={`p-4 sm:p-5 rounded-3xl border shadow-2xl flex items-center justify-between gap-3 animate-fade-in ${
                mensaje.tipo === 'exito' 
                  ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-200' 
                  : 'bg-rose-950/95 border-rose-800 text-rose-300'
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
            <section className="bg-zinc-900/95 border border-zinc-800 rounded-3xl p-4 sm:p-6 space-y-3 shadow-xl">
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
            <section className="bg-zinc-900/95 border border-zinc-800 rounded-3xl p-4 sm:p-6 space-y-3 shadow-xl">
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
                        <p className="text-xs text-zinc-400 mt-0.5">{c.tipo}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Horarios */}
            <section className="bg-zinc-900/95 border border-zinc-800 rounded-3xl p-4 sm:p-6 space-y-3.5 shadow-xl">
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

            {/* Formulario de Confirmación con el Selector Moderno */}
            {slotSeleccionado && (
              <form 
                ref={formRef}
                onSubmit={handlePreReservar} 
                className="bg-zinc-900/95 border border-emerald-500/40 rounded-3xl p-4 sm:p-6 space-y-4 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div>
                    <h3 className="font-extrabold text-white text-sm sm:text-base">Datos para transferir y confirmar</h3>
                    <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                      Turno seleccionado: {slotSeleccionado.horaInicio?.slice(0, 5)} hs
                    </p>
                  </div>
                </div>

                {/* 💳 DATOS DEL ALIAS Y MONTO EXACTO */}
                <div className="bg-zinc-950/80 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-4 h-4" /> Datos de pago por transferencia
                  </p>
                  
                  <div className="bg-zinc-900 p-3.5 rounded-xl border border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">ALIAS BANCARIO</span>
                      <span className="text-sm font-black text-white select-all">juan.45.mp</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-400 font-bold block">MONTO EXACTO</span>
                      <span className="text-base font-black text-emerald-300">
                        ${canchas.find(c => c.id === canchaSeleccionada)?.precioBase || '50'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300">
                    Realizá la transferencia por el monto exacto indicado arriba al alias provisto.
                  </p>

                  <p className="text-[11px] text-amber-400/90 font-medium">
                    ⚠️ Recordá que las cancelaciones se realizan con al menos 12 hs de anticipación.
                  </p>
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
                      onChange={(e) => setNombre(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''))}
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
                      onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3 text-zinc-100 text-base sm:text-sm focus:outline-none focus:border-emerald-400 transition"
                    />
                  </div>
                </div>

                {/* 🧾 ADJUNTAR CAPTURA DE COMPROBANTE (SELECTOR FLAMA CON BOTÓN QUITAR) */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                    Adjuntar Captura del Comprobante (Mercado Pago / Cuenta DNI) *
                  </label>
                  
                  <div className="relative">
                    {!comprobanteArchivo ? (
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-emerald-500/40 rounded-2xl bg-zinc-950/80 hover:bg-zinc-950 hover:border-emerald-400 transition cursor-pointer group">
                        <div className="flex flex-col items-center justify-center pt-2 pb-3 px-4 text-center">
                          <ImageIcon className="w-6 h-6 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                          <p className="text-xs text-zinc-300 font-semibold">
                            Hacé clic para seleccionar la captura
                          </p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">
                            PNG, JPG o JPEG (El comprobante es obligatorio)
                          </p>
                        </div>
                        <input
                          type="file"
                          required
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setComprobanteArchivo(e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="flex items-center justify-between bg-zinc-950 border border-emerald-500/50 rounded-2xl p-3.5 shadow-inner">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 flex-shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">
                              {comprobanteArchivo.name}
                            </p>
                            <p className="text-[10px] text-emerald-400 font-medium">
                              Archivo listo para enviar
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setComprobanteArchivo(null)}
                          title="Eliminar archivo"
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition cursor-pointer flex-shrink-0 flex items-center gap-1 text-xs font-bold"
                        >
                          <X className="w-4 h-4" />
                          <span className="hidden sm:inline">Quitar</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-500 block">
                    Subí la foto o captura del pago. El turno quedará confirmado al instante.
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-black text-xs sm:text-sm uppercase tracking-wider py-3.5 sm:py-4 px-4 rounded-2xl shadow-lg shadow-emerald-500/25 transition mt-2 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Continuar y Confirmar Turno</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </main>
        )}

      </div>
    </div>
  );
}