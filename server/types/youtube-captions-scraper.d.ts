declare module 'youtube-caption-extractor' {
  interface Caption {
    start: number;
    dur: number;
    text: string;
  }

  export function getSubtitles(options: {
    videoID: string;
    lang?: string;
  }): Promise<Caption[]>;
}
