import React from 'react';
import { AbsoluteFill, Video, staticFile, useVideoConfig } from 'remotion';
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
  
  // Handle video source based on environment
  let videoSource: string;
  
  if (videoSrc.startsWith('http://') || videoSrc.startsWith('https://')) {
    // Already a full URL
    videoSource = videoSrc;
  } else if (typeof window !== 'undefined' && window.location) {
    // Running in browser - use absolute URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
    videoSource = `${baseUrl}${videoSrc}`;
  } else {
    // Fallback for SSR/build time
    videoSource = videoSrc.startsWith('/') ? staticFile(videoSrc.slice(1)) : staticFile(videoSrc);
  }
  
  return (
    <AbsoluteFill>
      <AbsoluteFill>
        <Video src={videoSource} style={{ width, height }} />
      </AbsoluteFill>
      <Captions captions={captions} style={style} />
    </AbsoluteFill>
  );
};
