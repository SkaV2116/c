import { useState, useEffect } from 'react'
import type { Player } from '../lib/auth'
import {
  subscribeToInvitations,
  acceptInvitation,
  declineInvitation,
  type Invitation,
} from '../lib/kolkoOnline'

interface Props {
  player: Player
  onGameAccepted: (gameId: string) => void
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

  async function handleAccept() {
    if (processing) return
    setProcessing(inv.gameId)
    try {
      await acceptInvitation(inv.gameId, player.uid)
      onGameAccepted(inv.gameId)
    } catch {
      setProcessing(null)
    }
  }

  async function handleDecline() {
    if (processing) return
    setProcessing(inv.gameId)
    try {
      await declineInvitation(inv.gameId, player.uid)
      setProcessing(null)
    } catch {
      setProcessing(null)
    }
  }

  function getRoundsLabel(): string {
    if (inv.totalRounds === 0) return 'Bez limitu rund'
    return `${inv.totalRounds} ${inv.totalRounds === 1 ? 'runda' : inv.totalRounds < 5 ? 'rundy' : 'rund'}`
  }

  return (
    <div className="invitation-modal">
      <div className="invitation-box">
        <div className="invitation-title">Zaproszenie do gry!</div>
        <div className="invitation-from">
          Od: <strong>{inv.creatorUsername}</strong> #{inv.creatorPlayerId}
        </div>
        <div className="invitation-rounds">{getRoundsLabel()}</div>
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
