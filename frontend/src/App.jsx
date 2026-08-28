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

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
const API_BASE = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl}/api/v1`;
const CLUB_SLUG = 'padel-central';

const obtenerFechaLocalISO = (fechaObj = new Date()) => {
  const opciones = { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' };
  const partes = new Intl.DateTimeFormat('es-AR', opciones).formatToParts(fechaObj);
  const anio = partes.find(p => p.type === 'year').value;
  const mes = partes.find(p => p.type === 'month').value;
  const dia = partes.find(p => p.type === 'day').value;
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

function CalendarioPicker({ fechaSeleccionada, hoyISO, onSeleccionar, onCerrar }) {
  const [anioMes, setAnioMes] = useState(() => {
    const [a, m] = fechaSeleccionada.split('-').map(Number);
    return { anio: a, mes: m - 1 };
  });

  const nombresDias = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const primerDiaMes = new Date(anioMes.anio, anioMes.mes, 1);
  const diasEnMes = new Date(anioMes.anio, anioMes.mes + 1, 0).getDate();

  let offset = primerDiaMes.getDay() - 1;
  if (offset < 0) offset = 6;

  const celdas = [];
  for (let i = 0; i < offset; i++) celdas.push(null);
  for (let dia = 1; dia <= diasEnMes; dia++) celdas.push(dia);

  const formatearISO = (dia) => {
    const mm = String(anioMes.mes + 1).padStart(2, '0');
    const dd = String(dia).padStart(2, '0');
    return `${anioMes.anio}-${mm}-${dd}`;
  };

  const irMesAnterior = () => {
    setAnioMes(prev => {
      const mes = prev.mes - 1;
      return mes < 0 ? { anio: prev.anio - 1, mes: 11 } : { anio: prev.anio, mes };
    });
  };

  const irMesSiguiente = () => {
    setAnioMes(prev => {
      const mes = prev.mes + 1;
      return mes > 11 ? { anio: prev.anio + 1, mes: 0 } : { anio: prev.anio, mes };
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]" onClick={onCerrar}>
      <div
        className="bg-white text-zinc-900 rounded-2xl shadow-2xl p-4 w-72"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={irMesAnterior} className="p-1.5 rounded-lg hover:bg-zinc-100 cursor-pointer">◀</button>
          <span className="font-bold text-sm">{nombresMeses[anioMes.mes]} {anioMes.anio}</span>
          <button type="button" onClick={irMesSiguiente} className="p-1.5 rounded-lg hover:bg-zinc-100 cursor-pointer">▶</button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {nombresDias.map((d, i) => (
            <div key={i} className="text-center text-[10px] font-bold text-zinc-400 uppercase">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {celdas.map((dia, idx) => {
            if (dia === null) return <div key={idx} />;
            const iso = formatearISO(dia);
            const esHoy = iso === hoyISO;
            const esSeleccionado = iso === fechaSeleccionada;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => { onSeleccionar(iso); onCerrar(); }}
                className={`h-8 w-8 rounded-lg text-xs font-semibold transition cursor-pointer
                  ${esSeleccionado ? 'bg-emerald-500 text-white' : esHoy ? 'bg-emerald-100 text-emerald-700 font-black' : 'hover:bg-zinc-100 text-zinc-700'}`}
              >
                {dia}
              </button>
            );
          })}
        </div>
      </div>
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

  const hoyISO = obtenerFechaLocalISO();
  const [fecha, setFecha] = useState(hoyISO);
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [mostrarCalendarioBloqueo, setMostrarCalendarioBloqueo] = useState(false);

  const [slots, setSlots] = useState([]);
  const [slotSeleccionado, setSlotSeleccionado] = useState(null);
  const [reservaTemporalId, setReservaTemporalId] = useState(null);

  const [reservasAdmin, setReservasAdmin] = useState([]);
  const [ocultarCancelados, setOcultarCancelados] = useState(true);

  const [imagenModalUrl, setImagenModalUrl] = useState(null);

  const [mostrarModalCrearAdmin, setMostrarModalCrearAdmin] = useState(false);
  const [adminCanchaId, setAdminCanchaId] = useState('');
  const [adminFecha, setAdminFecha] = useState(hoyISO);
  const [adminHoraInicio, setAdminHoraInicio] = useState('');
  const [adminNombre, setAdminNombre] = useState('');
  const [adminTelefono, setAdminTelefono] = useState('');
  const [adminEsFijo, setAdminEsFijo] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminCanchaFijada, setAdminCanchaFijada] = useState(false);
  const [adminSlots, setAdminSlots] = useState([]);

  const [mostrarModalBloqueo, setMostrarModalBloqueo] = useState(false);
  const [bloqueoCanchaId, setBloqueoCanchaId] = useState('0');
  const [tipoBloqueoHorario, setTipoBloqueoHorario] = useState('DIA_COMPLETO');
  const [bloqueoHoraInicio, setBloqueoHoraInicio] = useState('');
  const [bloqueoMotivo, setBloqueoMotivo] = useState('Torneo');
  const [bloqueoFecha, setBloqueoFecha] = useState(hoyISO);
  const [bloqueoError, setBloqueoError] = useState('');
  const [bloqueando, setBloqueando] = useState(false);
  const [bloqueoSlots, setBloqueoSlots] = useState([]);

  const [tipoGestion, setTipoGestion] = useState('horario');
  const [nuevaApertura, setNuevaApertura] = useState('13:30');
  const [nuevoCierre, setNuevoCierre] = useState('21:00');

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [comprobanteArchivo, setComprobanteArchivo] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState(null);

  const [mostrarModalConfirmacionWA, setMostrarModalConfirmacionWA] = useState(false);
  const [horariosEspeciales, setHorariosEspeciales] = useState({});
  const formRef = useRef(null);
  const horariosEspecialesRef = useRef(horariosEspeciales);
  useEffect(() => {
    horariosEspecialesRef.current = horariosEspeciales;
  }, [horariosEspeciales]);

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

    const partesHoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const anio = Number(partesHoy.find(p => p.type === 'year').value);
    const mes = Number(partesHoy.find(p => p.type === 'month').value) - 1;
    const dia = Number(partesHoy.find(p => p.type === 'day').value);

    const baseHoy = new Date(anio, mes, dia);

    for (let i = 0; i < 8; i++) {
      const d = new Date(baseHoy);
      d.setDate(baseHoy.getDate() + i);

      const fechaISO = obtenerFechaLocalISO(d);
      const diaSemana = nombresDias[d.getDay()];
      const diaNumero = d.getDate();
      const mesNombre = meses[d.getMonth()];
      const etiqueta = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : `${diaSemana} ${diaNumero}`;

      lista.push({ fechaISO, etiqueta, diaNumero, diaSemana, mes: mesNombre });
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

    const horarioDia = horariosEspecialesRef.current[fecha];
    let url = `${API_BASE}/reservas/disponibilidad?canchaId=${canchaSeleccionada}&fecha=${fecha}`;

    if (horarioDia) {
      url += `&apertura=${horarioDia.apertura}&cierre=${horarioDia.cierre}`;
    }

    axios.get(url)
      .then(res => {
        const nuevosSlots = Array.isArray(res.data) ? res.data : [];
        setSlots(nuevosSlots);
      })
      .catch(() => setSlots([]));
  }, [canchaSeleccionada, fecha]);

  useEffect(() => {
    if (mostrarModalCrearAdmin && adminCanchaId && adminFecha) {
      const horarioDia = horariosEspeciales[adminFecha];
      let url = `${API_BASE}/reservas/disponibilidad?canchaId=${adminCanchaId}&fecha=${adminFecha}`;
      
      if (horarioDia) {
        url += `&apertura=${horarioDia.apertura}&cierre=${horarioDia.cierre}`;
      }

      axios.get(url)
        .then(res => {
          const data = Array.isArray(res.data) ? res.data : [];
          setAdminSlots(data);
          const libres = data.filter(s => s.disponible);
          if (libres.length > 0 && (!adminHoraInicio || !libres.some(s => s.horaInicio === adminHoraInicio))) {
            setAdminHoraInicio(libres[0].horaInicio);
          }
        })
        .catch(() => setAdminSlots([]));
    }
  }, [mostrarModalCrearAdmin, adminCanchaId, adminFecha, horariosEspeciales]);

  useEffect(() => {
    if (mostrarModalBloqueo && bloqueoFecha) {
      const canchaIdParaConsultar = (bloqueoCanchaId && bloqueoCanchaId !== '0') ? bloqueoCanchaId : (canchas[0]?.id || 1);
      
      // 👇 NUEVO: Buscamos si hay horario especial para la fecha de bloqueo
      const horarioDia = horariosEspeciales[bloqueoFecha];
      let url = `${API_BASE}/reservas/disponibilidad?canchaId=${canchaIdParaConsultar}&fecha=${bloqueoFecha}`;
      
      if (horarioDia) {
        url += `&apertura=${horarioDia.apertura}&cierre=${horarioDia.cierre}`;
      }

      axios.get(url)
        .then(res => {
          const data = Array.isArray(res.data) ? res.data : [];
          setBloqueoSlots(data);
          if (data.length > 0 && (!bloqueoHoraInicio || !data.some(s => s.horaInicio === bloqueoHoraInicio))) {
            setBloqueoHoraInicio(data[0].horaInicio);
          }
        })
        .catch(() => setBloqueoSlots([]));
    }
  }, [mostrarModalBloqueo, bloqueoFecha, bloqueoCanchaId, canchas, horariosEspeciales]);

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
      const intervalId = setInterval(cargarSlots, 1000);
      return () => clearInterval(intervalId);
    }
  }, [vistaAdmin, canchaSeleccionada, fecha, cargarSlots]);

  useEffect(() => {
    if (vistaAdmin && estaAutenticado && club?.id && fecha) {
      cargarReservasAdmin();
      const intervalId = setInterval(cargarReservasAdmin, 45000);
      return () => clearInterval(intervalId);
    }
  }, [vistaAdmin, estaAutenticado, fecha, club?.id, cargarReservasAdmin]);

  const handleSeleccionarSlot = async (slot) => {
    if (!slot.disponible) return;

    if (reservaTemporalId) {
      try {
        await axios.patch(`${API_BASE}/reservas/temporal/${reservaTemporalId}/liberar`);
      } catch (err) {
        console.error("Error al liberar el temporal anterior", err);
      }
    }

    const horaFormateada = slot.horaInicio.length === 5 ? `${slot.horaInicio}:00` : slot.horaInicio;

    try {
      const res = await axios.post(`${API_BASE}/reservas/temporal`, {
        canchaId: Number(canchaSeleccionada),
        fecha: fecha,
        horaInicio: horaFormateada,
        nombreCliente: "Bloqueo Temporal",
        telefonoCliente: "PENDIENTE"
      });

      setReservaTemporalId(res.data.id);
      setSlotSeleccionado(slot);
      cargarSlots();

    } catch (err) {
      console.error("Error al iniciar reserva temporal:", err.response?.data);
      cargarSlots();
      const msg = err.response?.data || 'Este horario está siendo seleccionado por otro usuario en este momento.';
      setMensaje({ tipo: 'error', texto: msg });

      setSlotSeleccionado(null);
      setReservaTemporalId(null);
    }
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
    if (cargando) return;
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
      if (!reservaTemporalId) {
        throw new Error("No hay una reserva temporal activa. Seleccioná el horario nuevamente.");
      }

      await axios.post(`${API_BASE}/reservas`, {
        canchaId: canchaSeleccionada,
        fecha,
        horaInicio: slotSeleccionado.horaInicio,
        nombreCliente: nombreFinal,
        telefonoCliente: telFinal
      });

      if (reservaTemporalId && comprobanteArchivo) {
        const formData = new FormData();
        formData.append('file', comprobanteArchivo);

        await axios.put(`${API_BASE}/reservas/${reservaTemporalId}/confirmar-pago`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      setMensaje({ tipo: 'exito', texto: '¡Turno reservado y comprobante adjuntado con éxito!' });
      cargarSlots();
      setNombre('');
      setTelefono('');
      setComprobanteArchivo(null);
      setSlotSeleccionado(null);
      setReservaTemporalId(null);

      setMostrarModalConfirmacionWA(false);

      const esMovil = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (esMovil) {
        window.location.href = schemeWhatsAppMobile;
      } else {
        window.open(urlWhatsAppWeb, '_blank');
      }

    } catch (err) {
      setMensaje({ tipo: 'error', texto: typeof err.response?.data === 'string' ? err.response.data : err.message || 'Error al procesar la reserva' });
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

    // Obtenemos el horario especial configurado para esta fecha exacta (si existe)
    const horarioEspecialDelDia = horariosEspeciales[bloqueoFecha];

    try {
      await axios.post(`${API_BASE}/reservas/bloqueos`, {
        canchaId: canchaParam,
        clubId: club?.id,
        fecha: bloqueoFecha,
        horaInicio: horaParam,
        hastaElCierre: esHastaElCierre,
        motivo: bloqueoMotivo,
        apertura: horarioEspecialDelDia ? horarioEspecialDelDia.apertura : null,
        cierre: horarioEspecialDelDia ? horarioEspecialDelDia.cierre : null
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

  const adminHorariosDisponibles = useMemo(() => {
    return adminSlots.filter(slot => slot.disponible);
  }, [adminSlots]);

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

      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-zinc-950">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-100"
          style={{ backgroundImage: `url(${FONDO})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/35 to-zinc-950" />
      </div>

      <div className="relative z-10 p-3 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-4 md:space-y-6">

        <header className="flex items-start justify-between bg-zinc-900/95 border border-zinc-800 p-4 sm:p-5 rounded-3xl shadow-xl gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="p-2.5 sm:p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-400 flex-shrink-0 mt-0.5">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-2xl font-black tracking-tight text-white truncate leading-tight">
                {club.nombre}
              </h1>

              <div className="flex items-start gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0 mt-0.5" />
                <span className="text-[11px] sm:text-xs text-zinc-400 leading-snug break-words">
                  {club.direccion}
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
                  {cargando ? 'Procesando...' : 'Enviar Confirmación por WhatsApp'}
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
                      onClick={(e) => e.target.showPicker && e.target.showPicker()}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3 text-zinc-100 text-base sm:text-sm focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
                    />
                  </div>
                  <div className="w-full min-w-0">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Hora Inicio (Disponibles)</label>
                    <select
                      value={adminHoraInicio}
                      onChange={(e) => setAdminHoraInicio(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3 text-zinc-100 text-base sm:text-sm focus:outline-none focus:border-emerald-500 appearance-none"
                    >
                      {adminHorariosDisponibles.length === 0 ? (
                        <option value="">No hay horarios libres</option>
                      ) : (
                        adminHorariosDisponibles.map((slot) => (
                          <option key={slot.horaInicio} value={slot.horaInicio}>
                            {slot.horaInicio?.slice(0, 5)} hs
                          </option>
                        ))
                      )}
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
                    disabled={adminHorariosDisponibles.length === 0}
                    className="flex-1 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold py-3 rounded-2xl text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50"
                  >
                    {adminEsFijo ? 'Crear Turno Fijo' : 'Registrar Turno'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Gestionar Complejo / Bloqueos */}
        {mostrarModalBloqueo && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-zinc-800 p-5 sm:p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-2 font-bold text-base sm:text-lg ${bloqueoCanchaId === '0' ? 'text-white' : 'text-rose-400'}`}>
                  <Shield className={`w-5 h-5 ${bloqueoCanchaId === '0' ? 'text-emerald-400' : 'text-rose-400'}`} />
                  {bloqueoCanchaId === '0' ? 'Gestionar Complejo' : 'Bloquear Cancha'}
                </div>
                <button
                  onClick={() => setMostrarModalBloqueo(false)}
                  className="p-1 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {bloqueoCanchaId === '0' && (
                <div className="grid grid-cols-2 gap-2 bg-zinc-800/60 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setTipoGestion('horario')}
                    className={`py-2 text-xs font-bold rounded-xl transition ${tipoGestion === 'horario' ? 'bg-emerald-500 text-black shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                  >
                    🕒 Horario del Día
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoGestion('bloqueo')}
                    className={`py-2 text-xs font-bold rounded-xl transition ${tipoGestion === 'bloqueo' ? 'bg-rose-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                  >
                    ⛔ Bloqueo Completo
                  </button>
                </div>
              )}

              {bloqueoCanchaId === '0' && tipoGestion === 'horario' ? (
                <div className="space-y-4">
                  <p className="text-xs text-zinc-400">
                    Definí la franja horaria en la que abrirá el complejo en la fecha seleccionada. Los turnos fuera de este rango se inhabilitarán automáticamente.
                  </p>

                  <div className="relative">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Fecha a configurar</label>
                    <button
                      type="button"
                      onClick={() => setMostrarCalendarioBloqueo(!mostrarCalendarioBloqueo)}
                      className="w-full text-left bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-3 text-zinc-100 text-base sm:text-sm focus:outline-none transition cursor-pointer"
                    >
                      {formatearFechaConDia(bloqueoFecha)}
                    </button>

                    {mostrarCalendarioBloqueo && (
                      <CalendarioPicker
                        fechaSeleccionada={bloqueoFecha}
                        hoyISO={hoyISO}
                        onSeleccionar={setBloqueoFecha}
                        onCerrar={() => setMostrarCalendarioBloqueo(false)}
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1">Abre a partir de (Ej: 13:30):</label>
                      <input
                        type="text"
                        placeholder="13:30"
                        maxLength={5}
                        value={nuevaApertura}
                        onChange={(e) => setNuevaApertura(e.target.value.replace(/[^0-9:]/g, ''))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1">Cierra a las (Ej: 21:00):</label>
                      <input
                        type="text"
                        placeholder="21:00"
                        maxLength={5}
                        value={nuevoCierre}
                        onChange={(e) => setNuevoCierre(e.target.value.replace(/[^0-9:]/g, ''))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!nuevaApertura || !nuevoCierre) {
                        setBloqueoError('Completá la hora de apertura y cierre.');
                        return;
                      }

                      // Convertimos las horas a minutos asegurando que 00:00 sea el cierre del día (24:00)
                      const convertirAMinutos = (horaStr, esCierre = false) => {
                        if (!horaStr) return 0;
                        const [h, m] = horaStr.split(':').map(Number);
                        if (esCierre && h === 0 && m === 0) return 24 * 60; // 00:00 de cierre vale como fin de día
                        return h * 60 + m;
                      };

                      const minApertura = convertirAMinutos(nuevaApertura, false);
                      const minCierre = convertirAMinutos(nuevoCierre, true);

                      if (minApertura >= minCierre) {
                        setBloqueoError('La hora de apertura debe ser menor a la de cierre.');
                        return;
                      }

                      setHorariosEspeciales(prev => ({
                        ...prev,
                        [bloqueoFecha]: { apertura: nuevaApertura, cierre: nuevoCierre }
                      }));

                      setBloqueoError('');
                      setMostrarModalBloqueo(false);
                      setMensaje({
                        tipo: 'exito',
                        texto: `¡Horario del ${bloqueoFecha} actualizado: abre a las ${nuevaApertura} y cierra a las ${nuevoCierre} hs!`
                      });

                      if (fecha === bloqueoFecha) {
                        cargarSlots();
                      }
                    }}
                    className="w-full mt-2 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold py-3 rounded-2xl transition cursor-pointer text-xs shadow-lg shadow-emerald-500/20"
                  >
                    Guardar Horario del Día
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBloquearTurnos} className="space-y-3.5">
                  {bloqueoError && (
                    <div className="p-3 rounded-2xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{bloqueoError}</span>
                    </div>
                  )}

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
                    <button
                      type="button"
                      onClick={() => setMostrarCalendarioBloqueo(!mostrarCalendarioBloqueo)}
                      className="w-full text-left bg-zinc-950 border border-zinc-800 hover:border-rose-500/50 rounded-2xl p-3 text-zinc-100 text-base sm:text-sm focus:outline-none transition cursor-pointer"
                    >
                      {formatearFechaConDia(bloqueoFecha)}
                    </button>

                    {mostrarCalendarioBloqueo && (
                      <CalendarioPicker
                        fechaSeleccionada={bloqueoFecha}
                        hoyISO={hoyISO}
                        onSeleccionar={setBloqueoFecha}
                        onCerrar={() => setMostrarCalendarioBloqueo(false)}
                      />
                    )}
                  </div>

                  <div className="bg-zinc-950/80 border border-zinc-800 p-3.5 rounded-2xl space-y-3">
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Rango de Horarios:
                    </label>

                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                      <button
                        type="button"
                        onClick={() => setTipoBloqueoHorario('DIA_COMPLETO')}
                        className={`p-2 rounded-xl border text-[10px] sm:text-[11px] font-bold text-center transition cursor-pointer ${tipoBloqueoHorario === 'DIA_COMPLETO'
                          ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                          }`}
                      >
                        Día Completo
                      </button>

                      <button
                        type="button"
                        onClick={() => setTipoBloqueoHorario('DESDE_HORA')}
                        className={`p-2 rounded-xl border text-[10px] sm:text-[11px] font-bold text-center transition cursor-pointer ${tipoBloqueoHorario === 'DESDE_HORA'
                          ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                          }`}
                      >
                        Desde hora
                      </button>

                      <button
                        type="button"
                        onClick={() => setTipoBloqueoHorario('SOLO_TURNO')}
                        className={`p-2 rounded-xl border text-[10px] sm:text-[11px] font-bold text-center transition cursor-pointer ${tipoBloqueoHorario === 'SOLO_TURNO'
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
                          {bloqueoSlots.length === 0 ? (
                            <option value="">No hay horarios disponibles</option>
                          ) : (
                            bloqueoSlots.map((slot) => (
                              <option key={slot.horaInicio} value={slot.horaInicio}>
                                {slot.horaInicio?.slice(0, 5)} hs
                              </option>
                            ))
                          )}
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
              )}
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

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={async () => {
                      if (confirm('¿Querés borrar todas las reservas de la base de datos de producción?')) {
                        try {
                          await axios.delete(`${API_BASE}/reservas/admin/reset-demo`);
                          alert('¡Base limpiada con éxito!');
                          window.location.reload();
                        } catch (err) {
                          alert('Error al limpiar la base');
                        }
                      }
                    }}
                    className="px-3.5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-xs rounded-2xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    🧹 Limpiar Demo
                  </button>

                  <button
                    onClick={() => {
                      setBloqueoError('');
                      setBloqueoFecha(fecha);
                      setBloqueoCanchaId('0');
                      setTipoGestion('horario');
                      setMostrarModalBloqueo(true);
                    }}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-zinc-950/60 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 font-bold text-xs rounded-2xl transition cursor-pointer shadow-inner"
                  >
                    <Shield className="w-3.5 h-3.5 text-emerald-400" /> Gestionar Complejo
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
                <div className="flex items-center gap-2.5 relative">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Fecha de planilla:
                  </label>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setMostrarCalendario(!mostrarCalendario)}
                      className="bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl px-4 py-2 text-emerald-400 text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer shadow-inner"
                    >
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      <span>{formatearFechaConDia(fecha)}</span>
                    </button>

                    {mostrarCalendario && (
                      <CalendarioPicker
                        fechaSeleccionada={fecha}
                        hoyISO={hoyISO}
                        onSeleccionar={setFecha}
                        onCerrar={() => setMostrarCalendario(false)}
                      />
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setOcultarCancelados(!ocultarCancelados)}
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${!ocultarCancelados
                    ? 'bg-zinc-900 border-emerald-500/50 text-emerald-400'
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                    }`}
                >
                  {ocultarCancelados ? <EyeOff className="w-3.5 h-3.5 text-zinc-500" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>{ocultarCancelados ? 'Cancelados ocultos' : 'Cancelados visibles'}</span>
                </button>
              </div>
            </div>

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
                            className={`p-3.5 rounded-2xl border transition flex flex-col gap-3 ${esBloqueado
                              ? 'bg-rose-950/20 border-rose-900/50 text-rose-200'
                              : esCancelado
                                ? 'bg-zinc-950/40 border-zinc-900 text-zinc-500 opacity-60'
                                : 'bg-zinc-950/70 border-zinc-800/90 text-zinc-200'
                              }`}
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-xs sm:text-sm text-white flex items-center gap-1.5">
                                  <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                  {reserva.horaInicio?.slice(0, 5)} - {reserva.horaFin?.slice(0, 5)} hs
                                </span>
                      
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${esBloqueado
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
                      
                            <div className="text-xs flex items-center justify-between gap-2 text-zinc-300 border-t border-zinc-800/60 pt-2 flex-wrap">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="font-semibold truncate">
                                  {reserva.nombreCliente || 'Sin nombre'}
                                </span>
                                {reserva.telefonoCliente && reserva.telefonoCliente !== 'ADMIN' && (
                                  <a
                                    href={`https://wa.me/${reserva.telefonoCliente.replace(/\D/g, '').startsWith('54') ? reserva.telefonoCliente.replace(/\D/g, '') : '549' + reserva.telefonoCliente.replace(/\D/g, '').replace(/^0/, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Abrir WhatsApp con el cliente"
                                    className="text-emerald-400 hover:text-emerald-300 font-bold text-[11px] inline-flex items-center gap-1 transition cursor-pointer ml-1"
                                  >
                                    • 📱 {reserva.telefonoCliente}
                                  </a>
                                )}
                                {(!reserva.telefonoCliente || reserva.telefonoCliente === 'ADMIN') && (
                                  <span className="text-zinc-500 text-[11px] truncate">
                                    • {reserva.telefonoCliente}
                                  </span>
                                )}
                              </div>
                      
                              {reserva.comprobanteImagen && (
                                <button
                                  onClick={() => {
                                    const baseURLSinApi = API_BASE.replace('/api/v1', '');
                                    setImagenModalUrl(`${baseURLSinApi}/uploads/${reserva.comprobanteImagen}`);
                                  }}
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
          <main className="space-y-4 sm:space-y-6">
            {mensaje && (
              <div className={`p-4 sm:p-5 rounded-3xl border shadow-2xl flex items-center justify-between gap-3 animate-fade-in ${mensaje.tipo === 'exito'
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
                      className={`p-2.5 sm:p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center cursor-pointer ${isSelected
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

            <section className="bg-zinc-900/95 border border-zinc-800 rounded-3xl p-4 sm:p-6 space-y-3 shadow-xl">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">2. Seleccioná la cancha</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {canchas.map(c => {
                  const isSelected = canchaSeleccionada === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setCanchaSeleccionada(c.id)}
                      className={`p-3.5 sm:p-4 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${isSelected
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
                      onClick={() => handleSeleccionarSlot(slot)}
                      className={`p-3 sm:p-3.5 rounded-2xl border text-center font-bold transition ${!slot.disponible
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
                      Turno seleccionado: {slotSeleccionado.horaInicio?.slice(0, 5)} hs (Bloqueado por 3 min)
                    </p>
                  </div>
                </div>

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

                <div className="space-y-2.5 mt-2">
                  <button
                    type="submit"
                    className="w-full bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-black text-xs sm:text-sm uppercase tracking-wider py-3.5 sm:py-4 px-4 rounded-2xl shadow-lg shadow-emerald-500/25 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Continuar y Confirmar Turno</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (reservaTemporalId) {
                        try {
                          await axios.patch(`${API_BASE}/reservas/temporal/${reservaTemporalId}/liberar`);
                        } catch (err) {
                          console.error("Error al liberar el turno temporal", err);
                        }
                      }
                      setSlotSeleccionado(null);
                      setReservaTemporalId(null);
                      setComprobanteArchivo(null);
                      cargarSlots();
                      window.scrollTo({ top: 200, behavior: 'smooth' });
                    }}
                    className="w-full bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-2xl transition cursor-pointer"
                  >
                    Elegir otro horario / Cancelar
                  </button>
                </div>
              </form>
            )}
          </main>
        )}

      </div>
    </div>
  );
}