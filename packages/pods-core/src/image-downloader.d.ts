declare module "image-downloader" {
  type Options = {
    url: string;
    dest: string;
  };
  export function image(options: Options): any;
}
