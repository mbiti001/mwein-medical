import { ImageResponse } from 'next/og'

export const size = {
  width: 192,
  height: 192
}

export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at 30% 30%, #38bdf8, #0f172a)',
          color: '#f8fafc',
          fontSize: 96,
          fontWeight: 700,
          letterSpacing: '-0.04em'
        }}
      >
        M
      </div>
    ),
    {
      ...size
    }
  )
}
