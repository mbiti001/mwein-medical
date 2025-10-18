import React, { useMemo } from 'react'

export type DonationItem = {
  id: string
  who: string
  amount?: string
  message?: string
  time?: string
  avatarUrl?: string
}

export type DonationRailProps = {
  items: DonationItem[]
  /** Total loop duration in seconds (longer = slower). Default 40s */
  durationSec?: number
  /** Height in pixels. Default 72 */
  heightPx?: number
  /** Optional className for external spacing */
  className?: string
}

type RailStyle = React.CSSProperties & Record<'--rail-height' | '--duration', string>

const DEFAULT_PLACEHOLDER: DonationItem = {
  id: 'placeholder',
  who: 'Mwein Supporter',
  amount: 'KES 500',
  message: 'Keeping care close to home',
  time: 'just now'
}

const MIN_CARS = 8

const DonationRail: React.FC<DonationRailProps> = ({
  items,
  durationSec = 40,
  heightPx = 72,
  className = ''
}) => {
  const { trainA, trainB } = useMemo(() => {
    const baseItems = items.length > 0 ? items : [DEFAULT_PLACEHOLDER]
    const repeats = Math.ceil(MIN_CARS / baseItems.length)
    const longList = Array.from({ length: repeats }).flatMap((_, index) =>
      baseItems.map(item => ({ ...item, id: `${item.id}-${index}` }))
    )

    return {
      trainA: longList,
      trainB: longList.map(item => ({ ...item, id: `${item.id}-clone` }))
    }
  }, [items])

  const railStyle: RailStyle = {
    '--rail-height': `${heightPx}px`,
    '--duration': `${durationSec}s`
  }

  return (
    <div className={`donation-rail ${className}`.trim()} style={railStyle} aria-label="Recent supporters">
      <div className="track" role="marquee" aria-live="off">
        <ul className="train" aria-hidden="false">
          {trainA.map(item => (
            <Car key={item.id} item={item} />
          ))}
        </ul>
        <ul className="train" aria-hidden="true">
          {trainB.map(item => (
            <Car key={item.id} item={item} />
          ))}
        </ul>
      </div>

      <style jsx>{`
        .donation-rail {
          position: relative;
          width: 100%;
          height: var(--rail-height);
          overflow: hidden;
          background: #f8fafc;
          border-top: 2px solid #e5e7eb;
          border-bottom: 2px solid #e5e7eb;
        }

        .donation-rail::before,
        .donation-rail::after {
          content: '';
          position: absolute;
          top: 0;
          width: 56px;
          height: 100%;
          z-index: 2;
          pointer-events: none;
        }
        .donation-rail::before {
          left: 0;
          background: linear-gradient(to right, #f8fafc, rgba(248, 250, 252, 0));
        }
        .donation-rail::after {
          right: 0;
          background: linear-gradient(to left, #f8fafc, rgba(248, 250, 252, 0));
        }

        .track {
          position: absolute;
          display: flex;
          align-items: center;
          gap: 0;
          inset: 0;
          animation: scroll-rtl var(--duration) linear infinite;
        }

        .donation-rail:hover .track,
        .donation-rail:focus-within .track {
          animation-play-state: paused;
        }

        .train {
          display: inline-flex;
          align-items: center;
          padding: 0;
          margin: 0;
          list-style: none;
        }

        @keyframes scroll-rtl {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .track {
            animation: none;
            transform: none;
          }
        }
      `}</style>
    </div>
  )
}

type CarProps = {
  item: DonationItem
}

function Car({ item }: CarProps) {
  const labelParts = [item.who]
  if (item.amount) labelParts.push(`donated ${item.amount}`)
  if (item.message) labelParts.push(item.message)

  return (
    <li className="car" tabIndex={0} aria-label={labelParts.join(' • ')}>
      {item.avatarUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img className="avatar" src={item.avatarUrl} alt="" />
      ) : (
        <span className="avatar fallback" aria-hidden="true">₭</span>
      )}

      <div className="meta">
        <div className="line">
          <strong className="who">{item.who}</strong>
          {item.amount ? <span className="dot">•</span> : null}
          {item.amount ? <span className="amount">{item.amount}</span> : null}
          {item.time ? <span className="time">{item.time}</span> : null}
        </div>
        {item.message ? <div className="msg" title={item.message}>{item.message}</div> : null}
      </div>

      <div className="wheels" aria-hidden="true">
        <span />
        <span />
      </div>

      <style jsx>{`
        .car {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin: 0 12px;
          padding: 10px 14px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          min-width: 220px;
          max-width: 340px;
          height: calc(var(--rail-height) - 18px);
          outline: none;
        }
        .car:focus {
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.35);
        }
        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          background: #ecfeff;
          border: 1px solid #e2e8f0;
          flex: 0 0 auto;
        }
        .fallback {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }
        .meta {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .line {
          display: flex;
          align-items: baseline;
          gap: 6px;
          white-space: nowrap;
          font-size: 14px;
        }
        .who {
          font-weight: 600;
          color: #0f172a;
        }
        .amount {
          font-weight: 600;
          color: #059669;
        }
        .time {
          color: #64748b;
          font-size: 12px;
        }
        .msg {
          font-size: 12px;
          line-height: 1.2;
          color: #334155;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 220px;
        }
        .dot {
          color: #94a3b8;
        }
        .wheels {
          position: absolute;
          bottom: -8px;
          left: 18px;
          right: 18px;
          display: flex;
          justify-content: space-between;
        }
        .wheels span {
          width: 10px;
          height: 10px;
          background: #111827;
          border-radius: 50%;
          box-shadow: 0 2px 0 #4b5563 inset;
        }
      `}</style>
    </li>
  )
}

export default DonationRail
