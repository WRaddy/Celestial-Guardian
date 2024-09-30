type Rank =
  | 'Cosmic Newborn'
  | 'Comet Rider'
  | 'Planet Pioneer'
  | 'Cosmic Pathfinder'
  | 'Moon Guardian'
  | 'Supernova Champion'
  | 'Galaxy pegaso'
  | 'Eternal Horizon';

export default interface Profile {
  username: string;
  bio: string;
  points: number;
  rank: Rank;
  level: number;
  createdAt: Date;
}
