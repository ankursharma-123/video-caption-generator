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
  
  // Video is now always a full URL from GCS, no need for staticFile()
  // Just use the URL directly
  
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
