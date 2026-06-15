interface Props {
  onClose: () => void
}

export default function StatkiInstrukcja({ onClose }: Props) {
  return (
    <div className="statki-instr-overlay" onClick={onClose}>
      <div className="statki-instr-box" onClick={e => e.stopPropagation()}>
        <div className="statki-instr-title">🚢 Jak grać w Statki</div>

        <div className="statki-instr-section">
          <h4>Cel gry</h4>
          <p>Zatop całą flotę przeciwnika, zanim on zatopi Twoją.</p>
        </div>

        <div className="statki-instr-section">
          <h4>Rozmieszczanie floty</h4>
          <p>
            Ustaw swoje statki na planszy. Statki nie mogą się stykać — nawet
            rogami (po przekątnej). Możesz obracać statki przyciskiem „Obróć” lub
            rozmieścić je losowo przyciskiem „Losuj”.
          </p>
        </div>

        <div className="statki-instr-section">
          <h4>Tury</h4>
          <ul>
            <li>Trafienie — strzelasz ponownie.</li>
            <li>Pudło — tura przechodzi na przeciwnika.</li>
          </ul>
        </div>

        <div className="statki-instr-section">
          <h4>Zestawy statków</h4>
          <ul>
            <li><strong>Polski Standard:</strong> 1×4, 2×3, 3×2, 4×1</li>
            <li><strong>Uproszczony:</strong> 1×4, 1×3, 2×2, 2×1</li>
          </ul>
        </div>

        <div className="statki-instr-section">
          <h4>Symbole</h4>
          <ul>
            <li>💥 — trafienie</li>
            <li>💧 — pudło</li>
            <li>🚢 — Twój statek</li>
          </ul>
        </div>

        <button className="btn-yellow" onClick={onClose} style={{ width: '100%' }}>
          Zamknij
        </button>
      </div>
    </div>
  )
}
