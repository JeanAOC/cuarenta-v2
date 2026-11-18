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
  /** Solo en la fase de grupos (round 0): índice del grupo, empieza en 0. */
  group?: number;
  /**
   * Partido de desempate (round 0, sin `group`): se juega solo si hay un empate exacto en el último cupo
   * entre los segundos de cada grupo. No suma a las tablas ni a las posiciones: solo decide quién pasa.
   */
  tb?: 'segundos';
};

export type Status = 'registro' | 'en_juego' | 'finalizado';

export type State = {
  status: Status;
  players: Player[];
  teams: Team[];
  matches: Match[];
  /**
   * Fase de grupos: ids de los equipos de cada grupo. Si no existe, el torneo es de eliminación
   * directa desde el principio. Los partidos de grupo tienen round 0; la eliminatoria, round 1 en adelante.
   */
  groups?: string[][];
  drawnAt: string | null;
};
