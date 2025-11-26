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

export interface RenderRequest {
  videoPath: string;
  captions: CaptionSegment[];
  style: string;
}

export interface RenderResponse {
  success: boolean;
  outputPath: string;
}

export interface UploadResponse {
  success: boolean;
  videoPath: string;
  captions: CaptionSegment[];
}

export interface ErrorResponse {
  error: string;
  details?: string;
}
