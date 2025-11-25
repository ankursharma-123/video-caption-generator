import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

export interface CaptionSegment {
  text: string;
  startTime: number;
  endTime: number;
  words?: Array<{
    word: string;
    startTime: number;
    endTime: number;
  }>;
}

interface CaptionsProps {
  captions: CaptionSegment[];
  style: 'bottom-centered' | 'top-bar' | 'karaoke';
}

export const Captions: React.FC<CaptionsProps> = ({ captions, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  const currentCaption = captions.find(
    (caption) => currentTime >= caption.startTime && currentTime <= caption.endTime
  );

  if (!currentCaption) return null;

  if (style === 'karaoke' && currentCaption.words && currentCaption.words.length > 0) {
    return (
      <AbsoluteFill style={styles.karaokeContainer}>
        <div style={styles.karaokeBox}>
          {currentCaption.words.map((word, index) => {
            const isHighlighted = currentTime >= word.startTime && currentTime <= word.endTime;
            return (
              <span
                key={index}
                style={{
                  ...styles.karaokeWord,
                  color: isHighlighted ? '#FFD700' : '#FFFFFF',
                  fontWeight: isHighlighted ? 'bold' : 'normal',
                }}
              >
                {word.word}{' '}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
    );
  }

  if (style === 'top-bar') {
    return (
      <AbsoluteFill style={styles.topBarContainer}>
        <div style={styles.topBar}>
          <p style={styles.topBarText}>{currentCaption.text}</p>
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={styles.bottomCenteredContainer}>
      <div style={styles.captionBox}>
        <p style={styles.captionText}>{currentCaption.text}</p>
      </div>
    </AbsoluteFill>
  );
};

const styles: Record<string, React.CSSProperties> = {
  bottomCenteredContainer: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: '0 40px 60px 40px',
  },
  captionBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: '15px 30px',
    borderRadius: '10px',
    maxWidth: '80%',
  },
  captionText: {
    color: '#FFFFFF',
    fontSize: '32px',
    fontFamily: '"Noto Sans", "Noto Sans Devanagari", sans-serif',
    textAlign: 'center',
    margin: 0,
    lineHeight: 1.4,
  },
  topBarContainer: {
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  topBar: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    padding: '20px 40px',
  },
  topBarText: {
    color: '#FFFFFF',
    fontSize: '28px',
    fontFamily: '"Noto Sans", "Noto Sans Devanagari", sans-serif',
    textAlign: 'center',
    margin: 0,
  },
  karaokeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0 40px',
  },
  karaokeBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    padding: '20px 40px',
    borderRadius: '15px',
    maxWidth: '90%',
    textAlign: 'center',
  },
  karaokeWord: {
    fontSize: '36px',
    fontFamily: '"Noto Sans", "Noto Sans Devanagari", sans-serif',
    transition: 'color 0.2s ease',
    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
  },
};
