export interface SoundtrackTrack {
  artist: string;
  title: string;
}

export interface RadioStation {
  name: string;
  slug: string;
  genre: string;
  spotifyUrl?: string;
  tracks: SoundtrackTrack[];
}

export interface SoundtrackData {
  game: string;
  slug: string;
  stations: RadioStation[];
}
