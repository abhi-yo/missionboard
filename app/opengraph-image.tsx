import { ImageResponse } from 'next/server'

export const runtime = 'edge'

export const alt = 'MissionBoard | Membership Command Center'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to right, #171717, #404040)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          color: 'white',
          padding: '40px',
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 'bold',
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          MissionBoard
        </div>
        <div
          style={{
            fontSize: 36,
            marginBottom: 40,
            textAlign: 'center',
          }}
        >
          Membership Command Center
        </div>
        <div
          style={{
            fontSize: 24,
            opacity: 0.8,
            maxWidth: '80%',
            textAlign: 'center',
          }}
        >
          Modern membership management for clubs, non-profits, and community groups
        </div>
      </div>
    ),
    size
  )
} 