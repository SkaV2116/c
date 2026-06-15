import { useState, useEffect } from 'react'
import type { Player } from '../lib/auth'
import {
  subscribeToInvitations,
  acceptInvitation,
  declineInvitation,
  type Invitation,
} from '../lib/kolkoOnline'
import { acceptStatkiInvitation, declineStatkiInvitation } from '../lib/statkiOnline'

interface Props {
  player: Player
  onGameAccepted: (gameId: string, gameType: 'kolko' | 'statki') => void
}

export default function InvitationListener({ player, onGameAccepted }: Props) {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    const unsub = subscribeToInvitations(player.uid, setInvitations)
    return unsub
  }, [player.uid])

  if (invitations.length === 0) return null

  const inv = invitations[0]

  const gameType = inv.gameType ?? 'kolko'

  async function handleAccept() {
    if (processing) return
    setProcessing(inv.gameId)
    try {
      if (gameType === 'statki') {
        await acceptStatkiInvitation(inv.gameId, player.uid)
      } else {
        await acceptInvitation(inv.gameId, player.uid)
      }
      onGameAccepted(inv.gameId, gameType)
    } catch {
      setProcessing(null)
    }
  }

  async function handleDecline() {
    if (processing) return
    setProcessing(inv.gameId)
    try {
      if (gameType === 'statki') {
        await declineStatkiInvitation(inv.gameId, player.uid)
      } else {
        await declineInvitation(inv.gameId, player.uid)
      }
      setProcessing(null)
    } catch {
      setProcessing(null)
    }
  }

  return (
    <div className="invitation-modal">
      <div className="invitation-box">
        <div className="invitation-title">Zaproszenie do gry!</div>
        <div className="invitation-from">
          Od: <strong>{inv.creatorUsername}</strong> #{inv.creatorPlayerId}
        </div>
        <div className="invitation-rounds">
          {gameType === 'statki' ? '🚢 Statki · ' : ''}{inv.settingsDisplay}
        </div>
        {invitations.length > 1 && (
          <div className="invitation-more">+{invitations.length - 1} więcej zaproszeń</div>
        )}
        <div className="invitation-btns">
          <button
            className="btn-secondary"
            onClick={handleDecline}
            disabled={processing !== null}
          >
            Odrzuć
          </button>
          <button
            className="btn-yellow"
            onClick={handleAccept}
            disabled={processing !== null}
          >
            {processing ? '...' : 'Przyjmij'}
          </button>
        </div>
      </div>
    </div>
  )
}
