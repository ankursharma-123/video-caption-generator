import React from 'react';
import { AbsoluteFill, Video, useVideoConfig } from 'remotion';
import { Captions, CaptionSegment } from './Captions';

export interface CaptionedVideoProps {
  videoSrc: string;
  captions: CaptionSegment[];
  style: 'bottom-centered' | 'top-bar' | 'karaoke';
}

export const CaptionedVideo: React.FC<CaptionedVideoProps> = ({
  videoSrc,
  captions,
  style,
}) => {
  const { width, height } = useVideoConfig();
  

  return (
    <AbsoluteFill>
      <AbsoluteFill>
        <Video 
          src={videoSrc} 
          style={{ width, height }}
          crossOrigin="anonymous"
        />
      </AbsoluteFill>
      <Captions captions={captions} style={style} />
    </AbsoluteFill>
  );
};
