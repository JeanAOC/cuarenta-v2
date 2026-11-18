export type Player = {
  id: string;
  name: string;
  /** Cuándo aceptó las reglas al anotarse. Vacío si lo agregó el organizador. */
  rulesAcceptedAt?: string;
};

/** Un equipo son siempre 2 jugadores. */
export type Team = { id: string; playerIds: string[] };

export type Match = {
  id: string;
  /** Empieza en 1. La última ronda es la final. */
  round: number;
  /** Posición dentro de la ronda, empieza en 0. */
  slot: number;
  a: string | null;
  b: string | null;
  scoreA: number | null;
  scoreB: number | null;
  winner: string | null;
  /**
   * Solo en la final jugada al mejor de 3: puntos de cada partida. En ese caso scoreA y scoreB
   * son las partidas ganadas (por ejemplo 2 y 1), no puntos.
   */
  games?: { a: number; b: number }[];
  /** Pase directo: en la ronda previa no tiene rival y avanza sin jugar. */
  bye: boolean;
};

export type Status = 'registro' | 'en_juego' | 'finalizado';

export type State = {
  status: Status;
  players: Player[];
  teams: Team[];
  matches: Match[];
  drawnAt: string | null;
};
