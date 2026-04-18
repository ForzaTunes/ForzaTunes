import { ImageResponse } from "workers-og";
import type { ReactNode } from "react";
import { OgFontLoader, type OgFont } from "./OgFontLoader";
import { OG_DIMENSIONS } from "./OgTheme";

export class OgCardRenderer {
  private constructor(private readonly fonts: OgFont[]) {}

  static async create(): Promise<OgCardRenderer> {
    const fonts = await OgFontLoader.load();
    return new OgCardRenderer(fonts);
  }

  render(element: ReactNode): Response {
    return new ImageResponse(element, {
      width: OG_DIMENSIONS.width,
      height: OG_DIMENSIONS.height,
      fonts: this.fonts,
      format: "png",
    });
  }
}
