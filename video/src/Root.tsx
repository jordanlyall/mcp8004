import React from 'react'
import { Composition } from 'remotion'
import { Mcp8004Demo } from './Mcp8004Demo'

export const Root: React.FC = () => (
  <Composition
    id="Mcp8004Demo"
    component={Mcp8004Demo}
    durationInFrames={900}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{}}
  />
)
