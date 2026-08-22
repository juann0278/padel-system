import React from 'react';
import './PadelLoader.css';

export default function PadelLoader({ text = "Cargando complejo..." }) {
  return (
    <div className="padel-loader-container">
      <div className="padel-icon-wrapper">
        <svg viewBox="0 0 100 100" className="padel-svg">
          <defs>
            {/* Máscara animada para el efecto de llenado */}
            <clipPath id="fill-clip">
              <rect className="liquid-fill" x="0" y="0" width="100" height="100" />
            </clipPath>
          </defs>

          {/* Silueta de fondo (Gris oscuro) */}
          <g className="padel-bg">
            <rect x="45" y="65" width="10" height="28" rx="4" fill="#334155" />
            <path d="M 50 10 C 28 10, 22 28, 22 45 C 22 62, 38 68, 50 68 C 62 68, 78 62, 78 45 C 78 28, 72 10, 50 10 Z" fill="#1e293b" stroke="#334155" strokeWidth="3" />
            {/* Agujeros */}
            <circle cx="42" cy="32" r="2.5" fill="#0f172a" />
            <circle cx="50" cy="32" r="2.5" fill="#0f172a" />
            <circle cx="58" cy="32" r="2.5" fill="#0f172a" />
            <circle cx="38" cy="42" r="2.5" fill="#0f172a" />
            <circle cx="46" cy="42" r="2.5" fill="#0f172a" />
            <circle cx="54" cy="42" r="2.5" fill="#0f172a" />
            <circle cx="62" cy="42" r="2.5" fill="#0f172a" />
            <circle cx="42" cy="52" r="2.5" fill="#0f172a" />
            <circle cx="50" cy="52" r="2.5" fill="#0f172a" />
            <circle cx="58" cy="52" r="2.5" fill="#0f172a" />
          </g>

          {/* Relleno Turquesa animado */}
          <g clipPath="url(#fill-clip)">
            <rect x="45" y="65" width="10" height="28" rx="4" fill="#06b6d4" />
            <path d="M 50 10 C 28 10, 22 28, 22 45 C 22 62, 38 68, 50 68 C 62 68, 78 62, 78 45 C 78 28, 72 10, 50 10 Z" fill="#06b6d4" />
            {/* Agujeros sobre el relleno */}
            <circle cx="42" cy="32" r="2.5" fill="#0f172a" />
            <circle cx="50" cy="32" r="2.5" fill="#0f172a" />
            <circle cx="58" cy="32" r="2.5" fill="#0f172a" />
            <circle cx="38" cy="42" r="2.5" fill="#0f172a" />
            <circle cx="46" cy="42" r="2.5" fill="#0f172a" />
            <circle cx="54" cy="42" r="2.5" fill="#0f172a" />
            <circle cx="62" cy="42" r="2.5" fill="#0f172a" />
            <circle cx="42" cy="52" r="2.5" fill="#0f172a" />
            <circle cx="50" cy="52" r="2.5" fill="#0f172a" />
            <circle cx="58" cy="52" r="2.5" fill="#0f172a" />
          </g>
        </svg>

        {/* Pelotita rebotando al lado */}
        <div className="padel-ball"></div>
      </div>

      <p className="loader-text">{text}</p>
    </div>
  );
}