export type CarImageVariant = "card" | "tile" | "hero" | "og" | "public";

export interface CarImageSource {
  imageKey?: string | null;
  imageUrl?: string | null;
}

export const CAR_IMAGE_PLACEHOLDER = "/images/car-placeholder.svg";

export const CAR_IMAGE_ONERROR = `this.onerror=null;this.src='${CAR_IMAGE_PLACEHOLDER}'`;

export class CarImageUrlResolver {
  private static readonly R2_PUBLIC_BASE = "https://images.forzatunes.com";
  private static readonly ZONE_BASE = "https://forzatunes.com";

  private static readonly VARIANT_OPTIONS: Record<CarImageVariant, string> = {
    card: "width=600,height=400,fit=cover,format=auto,quality=85",
    tile: "width=400,height=300,fit=cover,format=auto,quality=85",
    hero: "width=1200,height=800,fit=cover,format=auto,quality=85",
    og: "width=720,height=720,fit=cover,format=png,quality=90",
    public: "width=1600,format=auto,quality=90",
  };

  static forKey(imageKey: string, variant: CarImageVariant): string {
    const opts = this.VARIANT_OPTIONS[variant];
    return `${this.ZONE_BASE}/cdn-cgi/image/${opts}/${this.R2_PUBLIC_BASE}/${imageKey}`;
  }

  static forCar(
    car: CarImageSource,
    variant: CarImageVariant,
  ): string | null {
    if (car.imageKey) return this.forKey(car.imageKey, variant);
    if (car.imageUrl) return car.imageUrl;
    return null;
  }

  static forCarOrPlaceholder(
    car: CarImageSource,
    variant: CarImageVariant,
  ): string {
    return this.forCar(car, variant) ?? CAR_IMAGE_PLACEHOLDER;
  }
}
