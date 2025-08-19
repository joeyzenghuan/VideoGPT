declare module 'youtube-caption-extractor' {
  interface Caption {
    start: string | number;  // 实际返回的是字符串
    dur: string | number;    // 实际返回的是字符串
    text: string;
  }

  export function getSubtitles(options: {
    videoID: string;
    lang?: string;
  }): Promise<Caption[]>;
}
