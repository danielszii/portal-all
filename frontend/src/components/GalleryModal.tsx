import { X } from 'lucide-react'
import { useDialog } from '@/hooks/useDialog'
import type { GaleriaFoto } from '@/types'
export default function GalleryModal({ fotos, index, onIndex, onClose }: { fotos: GaleriaFoto[]; index: number; onIndex: (index: number) => void; onClose: () => void }) {
  const dialog = useDialog(onClose)
  const foto = fotos[index]
  if (!foto) return null
  return <div ref={dialog} tabIndex={-1} className="lightbox" role="dialog" aria-modal="true" aria-labelledby="gallery-modal-title" aria-describedby="gallery-modal-position" onClick={onClose}>
    <button type="button" className="lightbox-close" onClick={onClose} aria-label="Fechar galeria"><X size={20} aria-hidden="true" /></button>
    <div className="lightbox-inner" onClick={e => e.stopPropagation()}>
      <img src={foto.src.replace('w=800', 'w=1400')} alt={foto.legenda} decoding="async" />
      <p className="lightbox-legenda" id="gallery-modal-title">{foto.legenda}</p>
      <div className="lightbox-nav">
        <button type="button" onClick={() => onIndex((index + fotos.length - 1) % fotos.length)} aria-label="Fotografia anterior">← Anterior</button>
        <span id="gallery-modal-position" aria-live="polite">Fotografia {index + 1} de {fotos.length}</span>
        <button type="button" onClick={() => onIndex((index + 1) % fotos.length)} aria-label="Próxima fotografia">Próxima →</button>
      </div>
    </div>
  </div>
}
