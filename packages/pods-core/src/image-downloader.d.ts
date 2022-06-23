declare module "image-downloader" {
  type DImageDownloaderOptions = {
    url: string;
    dest: string;
  };
  export function image(options: DImageDownloaderOptions): any;
}
