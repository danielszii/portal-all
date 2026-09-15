import React from 'react'

interface MemberPhotoFrameProps {
  src?: string
  alt: string
  size?: 'sm' | 'md' | 'lg'
  status?: string
  chairNumber?: string
  className?: string
  isVaga?: boolean
}

// Classical ornamental corner SVG in antique gold
function CornerOrnament({ position }: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) {
  const rotationClass = {
    'top-left': '',
    'top-right': 'rotate-90',
    'bottom-right': 'rotate-180',
    'bottom-left': '-rotate-90',
  }[position]

  return (
    <div className={`academic-frame-corner academic-frame-corner--${position} ${rotationClass}`} aria-hidden="true">
      <svg
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="corner-svg"
      >
        {/* Outer ornate L-bracket */}
        <path
          d="M 2 26 V 7 C 2 4.238 4.238 2 7 2 H 26"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Inner parallel accent */}
        <path
          d="M 6 22 V 9 C 6 7.343 7.343 6 9 6 H 22"
          stroke="currentColor"
          strokeWidth="0.9"
          strokeLinecap="round"
          strokeOpacity="0.85"
        />
        {/* Diagonal floral fleuron line */}
        <path
          d="M 4 4 L 11 11"
          stroke="currentColor"
          strokeWidth="0.9"
          strokeLinecap="round"
          strokeOpacity="0.75"
        />
        {/* Central rosette / pearl dot */}
        <circle cx="8" cy="8" r="1.5" fill="currentColor" />
        {/* Accent dot at vertex */}
        <circle cx="3.5" cy="3.5" r="0.9" fill="currentColor" />
      </svg>
    </div>
  )
}

export default function MemberPhotoFrame({
  src,
  alt,
  size = 'md',
  status,
  chairNumber,
  className = '',
  isVaga = false,
}: MemberPhotoFrameProps) {
  const isMemoriam = status === 'In memoriam'
  const isChairVaga = isVaga || status === 'Vaga'

  return (
    <div
      className={`academic-frame academic-frame--${size} ${isMemoriam ? 'academic-frame--memoriam' : ''} ${isChairVaga ? 'academic-frame--vaga' : ''} ${className}`}
    >
      {/* Outer frame structure */}
      <div className="academic-frame-outer">
        {/* Chair number badge in the top-left corner inside the card */}
        {chairNumber && (
          <div className="academic-chair-tag" aria-label={`Cadeira ${chairNumber}`} title={`Cadeira ${chairNumber}`}>
            <span className="academic-chair-tag-num">{chairNumber}</span>
          </div>
        )}

        {/* 4 Corner Ornaments (Top-left corner is rendered if no badge or subtly integrated) */}
        {!chairNumber && <CornerOrnament position="top-left" />}
        <CornerOrnament position="top-right" />
        <CornerOrnament position="bottom-right" />
        <CornerOrnament position="bottom-left" />

        {/* Passe-partout (Paspatur matting) */}
        <div className="academic-frame-matting">
          {/* Inner golden bezel rim */}
          <div className="academic-frame-bezel">
            {isChairVaga ? (
              <div className="academic-frame-empty">
                <div className="academic-empty-crest">
                  <span className="academic-empty-ornament">❧</span>
                  <span className="academic-empty-label">Cadeira Vaga</span>
                  {chairNumber && <span className="academic-empty-number">N.º {chairNumber}</span>}
                </div>
              </div>
            ) : (
              <div className="academic-frame-photo">
                <img
                  src={src}
                  alt={alt}
                  loading="lazy"
                  className="academic-photo-img"
                />
                {/* Subtle sheen highlight layer on hover */}
                <div className="academic-photo-sheen" aria-hidden="true" />
              </div>
            )}
          </div>
        </div>

        {/* Memorial ribbon tag if applicable */}
        {isMemoriam && size === 'lg' && (
          <div className="academic-frame-ribbon">
            <span>In memoriam</span>
          </div>
        )}
      </div>
    </div>
  )
}
