import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  XCircle,
  Lock,
  ChevronRight,
  Info
} from "lucide-react";

// URL base del backend tomada de variables de entorno de Vite
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export default function App() {
  const [club, setClub] = useState(null);
  const [canchas, setCanchas] = useState([]);
  const [selectedCancha, setSelectedCancha] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Estados del Formulario de Reserva
  const [nombreCliente, setNombreCliente] = useState("");
  const [telefonoCliente, setTelefonoCliente] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Estados del Panel de Administración
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // 1. Carga inicial del Club y sus Canchas
  useEffect(() => {
    fetchClubData();
  }, []);

  const fetchClubData = async () => {
    try {
      const res = await axios.get(`${API_URL}/clubes/padel-central`);
      setClub(res.data);
      if (res.data.canchas && res.data.canchas.length > 0) {
        setCanchas(res.data.canchas);
        setSelectedCancha(res.data.canchas[0]);
      }
    } catch (err) {
      console.error("Error al cargar los datos del club:", err);
      setErrorMessage("No se pudo conectar con el servidor del turnero.");
    }
  };

  // 2. Carga de Disponibilidad de Horarios
  useEffect(() => {
    if (selectedCancha && selectedDate) {
      fetchDisponibilidad();
    }
  }, [selectedCancha, selectedDate]);

  const fetchDisponibilidad = async () => {
    setLoadingSlots(true);
    setErrorMessage("");
    try {
      const res = await axios.get(`${API_URL}/reservas/disponibilidad`, {
        params: {
          canchaId: selectedCancha.id,
          fecha: selectedDate,
        },
      });
      setSlots(res.data);
    } catch (err) {
      console.error("Error al obtener disponibilidad:", err);
      setErrorMessage("Error al cargar los horarios de la cancha.");
    } finally {
      setLoadingSlots(false);
    }
  };

  // 3. Manejo de Reserva Pública
  const handleBooking = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    setErrorMessage("");

    try {
      const payload = {
        canchaId: selectedCancha.id,
        nombreCliente,
        telefonoCliente,
        fecha: selectedDate,
        horaInicio: selectedSlot.horaInicio,
        horaFin: selectedSlot.horaFin,
      };

      await axios.post(`${API_URL}/reservas`, payload);
      setBookingSuccess(true);
      fetchDisponibilidad();
    } catch (err) {
      console.error("Error al reservar:", err);
      setErrorMessage(
        err.response?.data?.message || "El turno seleccionado ya no está disponible."
      );
    } finally {
      setBookingLoading(false);
    }
  };

  // 4. Funcionalidades del Panel Admin
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPin === "lovepadel") {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminPin("");
    } else {
      alert("PIN de administración incorrecto");
    }
  };

  const handleBloquearTurno = async (slot) => {
    try {
      const payload = {
        canchaId: selectedCancha.id,
        nombreCliente: "BLOQUEO ADMIN",
        telefonoCliente: club.telefono || "0000000000",
        fecha: selectedDate,
        horaInicio: slot.horaInicio,
        horaFin: slot.horaFin,
      };
      await axios.post(`${API_URL}/reservas`, payload);
      fetchDisponibilidad();
    } catch (err) {
      alert("Error al bloquear el turno");
    }
  };

  const handleCancelarTurno = async (reservaId) => {
    if (!window.confirm("¿Seguro que deseas cancelar este turno?")) return;
    try {
      await axios.delete(`${API_URL}/reservas/${reservaId}`, {
        params: { pin: "lovepadel" },
      });
      fetchDisponibilidad();
    } catch (err) {
      alert("Error al cancelar el turno");
    }
  };

  const handleWhatsAppRedirect = () => {
    const texto = `¡Hola ${club?.nombre}! Quiero confirmar mi reserva:\n🎾 *Cancha:* ${selectedCancha?.nombre}\n📅 *Fecha:* ${selectedDate}\n⏰ *Horario:* ${selectedSlot?.horaInicio} a ${selectedSlot?.horaFin} hs\n👤 *Nombre:* ${nombreCliente}`;
    const url = `https://wa.me/549${club?.telefono}?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");
  };

  const resetSelection = () => {
    setSelectedSlot(null);
    setBookingSuccess(false);
    setNombreCliente("");
    setTelefonoCliente("");
    setErrorMessage("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-black">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/20">
              P
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none tracking-tight">
                {club ? club.nombre : "Padel Central"}
              </h1>
              <span className="text-xs text-slate-400">Reserva de canchas online</span>
            </div>
          </div>

          <div>
            {isAdmin ? (
              <button
                onClick={() => setIsAdmin(false)}
                className="text-xs bg-red-950/60 border border-red-800 text-red-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" /> Salir de Modo Admin
              </button>
            ) : (
              <button
                onClick={() => setShowAdminLogin(true)}
                className="text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Soy Administrador
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        {/* Notificaciones */}
        {errorMessage && (
          <div className="bg-red-950/40 border border-red-800/80 rounded-xl p-4 flex items-start gap-3 text-red-200 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-sm">{errorMessage}</div>
          </div>
        )}

        {/* 1. Selector de Cancha y Fecha */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Canchas */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
              1. Seleccioná la Cancha
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {canchas.map((cancha) => (
                <button
                  key={cancha.id}
                  onClick={() => {
                    setSelectedCancha(cancha);
                    resetSelection();
                  }}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                    selectedCancha?.id === cancha.id
                      ? "bg-emerald-950/30 border-emerald-500/80 ring-1 ring-emerald-500/50"
                      : "bg-slate-950 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <div className="font-semibold text-sm text-slate-100">
                      {cancha.nombre}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Tipo: {cancha.tipo}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-emerald-400">
                      ${cancha.precioBase?.toLocaleString("es-AR")}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Fecha */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                2. Seleccioná el Día
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    resetSelection();
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-base text-slate-100 font-medium focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs text-slate-500">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              Los turnos tienen una duración fija de 90 minutos.
            </div>
          </div>
        </section>

        {/* 2. Grilla de Horarios */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                3. Horarios Disponibles
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedCancha?.nombre} &bull; {selectedDate}
              </p>
            </div>
            {isAdmin && (
              <span className="text-xs bg-amber-950/60 border border-amber-800 text-amber-300 px-2.5 py-1 rounded-md font-medium">
                Modo Administrador Activado
              </span>
            )}
          </div>

          {loadingSlots ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 space-y-2">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs">Consultando disponibilidad de turnos...</span>
            </div>
          ) : slots.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No hay turnos configurados para esta fecha.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {slots.map((slot, index) => {
                const isSelected =
                  selectedSlot?.horaInicio === slot.horaInicio;
                return (
                  <div
                    key={index}
                    className={`relative rounded-xl border p-3 flex flex-col justify-between transition-all ${
                      slot.disponible
                        ? isSelected
                          ? "bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-lg shadow-emerald-500/20"
                          : "bg-slate-950 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 cursor-pointer"
                        : "bg-slate-900/40 border-slate-800/40 text-slate-600 cursor-not-allowed"
                    }`}
                    onClick={() => {
                      if (slot.disponible) {
                        setSelectedSlot(slot);
                        setBookingSuccess(false);
                      }
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1.5">
                        <Clock className={`w-3.5 h-3.5 ${isSelected ? "text-slate-950" : "text-slate-400"}`} />
                        <span className="text-sm font-semibold tracking-tight">
                          {slot.horaInicio}
                        </span>
                      </div>
                      <span className="text-[10px] opacity-70">
                        {slot.horaFin}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          slot.disponible
                            ? isSelected
                              ? "bg-slate-950/20 text-slate-950"
                              : "bg-emerald-950 text-emerald-400 border border-emerald-800/50"
                            : "bg-red-950/30 text-red-400/80 border border-red-900/30"
                        }`}
                      >
                        {slot.disponible ? "LIBRE" : "OCUPADO"}
                      </span>

                      {/* Botones de Administrador */}
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          {slot.disponible ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBloquearTurno(slot);
                              }}
                              title="Bloquear turno"
                              className="p-1 hover:bg-slate-800 rounded text-amber-400"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            slot.reservaId && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelarTurno(slot.reservaId);
                                }}
                                title="Liberar/Cancelar turno"
                                className="p-1 hover:bg-slate-800 rounded text-red-400"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </div>

                    {!slot.disponible && slot.nombreCliente && isAdmin && (
                      <div className="text-[10px] text-slate-400 mt-2 truncate border-t border-slate-800 pt-1">
                        {slot.nombreCliente}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 3. Modal/Panel de Reserva */}
        {selectedSlot && (
          <section className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            {!bookingSuccess ? (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-100">
                      Confirmar Reserva
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedCancha?.nombre} &bull; {selectedDate} ({selectedSlot.horaInicio} a {selectedSlot.horaFin} hs)
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedSlot(null)}
                    className="p-1 hover:bg-slate-800 rounded-lg text-slate-400"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleBooking} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Nombre Completo
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          required
                          placeholder="Ej: Juan Pérez"
                          value={nombreCliente}
                          onChange={(e) => setNombreCliente(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-base text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Teléfono / WhatsApp
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                        <input
                          type="tel"
                          required
                          placeholder="Ej: 2494123456"
                          value={telefonoCliente}
                          onChange={(e) => setTelefonoCliente(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-base text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                    <div>
                      <span className="text-xs text-slate-400">Total a Pagar en el Club:</span>
                      <div className="text-lg font-bold text-emerald-400">
                        ${selectedCancha?.precioBase?.toLocaleString("es-AR")}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedSlot(null)}
                        className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-sm font-medium transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={bookingLoading}
                        className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                      >
                        {bookingLoading ? "Reservando..." : "Confirmar Turno"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 bg-emerald-950 border border-emerald-500/50 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">
                    ¡Turno Reservado con Éxito!
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Te esperamos en <b>{club?.nombre}</b> para tu turno en la <b>{selectedCancha?.nombre}</b> el día <b>{selectedDate}</b> a las <b>{selectedSlot.horaInicio} hs</b>.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                  <button
                    onClick={handleWhatsAppRedirect}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    <span>Enviar Comprobante por WhatsApp</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={resetSelection}
                    className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-sm font-medium transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Modal Login Admin */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xs w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-slate-100 flex items-center gap-2 text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Acceso Administrador
              </h4>
              <button
                onClick={() => setShowAdminLogin(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Ingresá el PIN de Seguridad
                </label>
                <input
                  type="password"
                  autoFocus
                  required
                  placeholder="PIN"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-base text-center font-mono tracking-widest text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-white text-slate-950 text-xs font-bold transition-all"
              >
                Ingresar al Panel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}