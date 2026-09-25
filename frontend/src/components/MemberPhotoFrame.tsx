import { formatNumeroCadeira } from '@/utils/formatters'

interface MemberPhotoFrameProps {
  src?: string
  alt: string
  size?: 'md' | 'lg'
  status?: string
  chairNumber?: string
  className?: string
  isVaga?: boolean
  photoVariant?: 'source' | 'institutional-demo'
  demoPortraitIndex?: number
}

const institutionalDemoPortraits = [
  '/images/membros/retrato-institucional-01.png',
  '/images/membros/retrato-institucional-02.png',
  '/images/membros/retrato-institucional-03.png',
  '/images/membros/retrato-institucional-04.png',
]

function getInstitutionalDemoPortrait(chairNumber?: string) {
  const key = chairNumber || 'academia'
  const index = [...key].reduce((total, character) => total + character.charCodeAt(0), 0) % institutionalDemoPortraits.length
  return institutionalDemoPortraits[index]
}

function OrnateCorner({ position }: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) {
  return (
    <div className={`ornate-frame-corner ornate-frame-corner--${position}`} aria-hidden="true">
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path className="ornate-corner-line" d="M3 58V10c0-4 3-7 7-7h48" />
        <path className="ornate-corner-line ornate-corner-line--inner" d="M9 50V15c0-3 3-6 6-6h35" />
        <path className="ornate-corner-curve" d="M4 32C18 29 29 18 32 4" />
        <path className="ornate-corner-curve ornate-corner-curve--inner" d="M9 38C24 33 33 24 38 9" />
        <path className="ornate-corner-scroll" d="M15 29c0-8 6-15 14-15 7 0 9 8 4 11-4 3-9-1-6-5" />
        <path className="ornate-corner-diamond" d="m9 9 5-5 5 5-5 5-5-5Z" />
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
  photoVariant = 'source',
  demoPortraitIndex,
}: MemberPhotoFrameProps) {
  const displayedChairNumber = chairNumber ? formatNumeroCadeira(chairNumber) : ''
  const isMemoriam = status === 'In memoriam'
  const isChairVaga = isVaga || status === 'Vaga'
  const normalizedPortraitIndex = demoPortraitIndex === undefined
    ? undefined
    : Math.abs(demoPortraitIndex) % institutionalDemoPortraits.length
  const photoSrc = photoVariant === 'institutional-demo'
    ? normalizedPortraitIndex === undefined
      ? getInstitutionalDemoPortrait(chairNumber)
      : institutionalDemoPortraits[normalizedPortraitIndex]
    : src

  return (
    <div
      className={`academic-frame academic-frame--${size} academic-frame--ornate academic-frame--${photoVariant} ${isMemoriam ? 'academic-frame--memoriam' : ''} ${isChairVaga ? 'academic-frame--vaga' : ''} ${className}`}
    >
      {/* Outer frame structure */}
      <div className="academic-frame-outer">
        {/* Chair number badge in the top-left corner inside the card */}
        {chairNumber && (
          <div className="academic-chair-tag" aria-label={`Cadeira ${displayedChairNumber}`} title={`Cadeira ${displayedChairNumber}`}>
            <span className="academic-chair-tag-num">{displayedChairNumber}</span>
          </div>
        )}

        <OrnateCorner position="top-left" />
        <OrnateCorner position="top-right" />
        <OrnateCorner position="bottom-right" />
        <OrnateCorner position="bottom-left" />

        {/* Passe-partout (Paspatur matting) */}
        <div className="academic-frame-matting">
          {/* Inner golden bezel rim */}
          <div className="academic-frame-bezel">
            {isChairVaga ? (
              <div className="academic-frame-empty">
                <div className="academic-empty-crest">
                  <span className="academic-empty-ornament">❧</span>
                  <span className="academic-empty-label">Cadeira Vaga</span>
                  {chairNumber && <span className="academic-empty-number">N.º {displayedChairNumber}</span>}
                </div>
              </div>
            ) : (
              <div className="academic-frame-photo">
                <img
                  src={photoSrc}
                  alt={photoVariant === 'institutional-demo' ? 'Retrato ilustrativo. Fotografia do acadêmico não disponibilizada.' : alt}
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
