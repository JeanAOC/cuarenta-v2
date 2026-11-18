import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Reglas · Cuarenta B-TECH' };

export default function Reglas() {
  return (
    <div className="page">
      <h1>Reglas del torneo</h1>
      <p className="lead">
        Estas reglas se fijaron antes de empezar y no cambian durante el torneo, ni para un partido.
      </p>

      <div className="rules">
        <section>
          <h2>Formato</h2>
          <ul>
            <li>Se juega por parejas. Los equipos se sortean al azar con los jugadores anotados.</li>
            <li>Eliminación directa: pierdes un partido y quedas fuera.</li>
            <li>
              Cada cruce es un solo partido. Gana la primera pareja que llega a 40 puntos. La única
              excepción es la final, que puede jugarse al mejor de 3 (ver más abajo).
            </li>
            <li>
              El sorteo arma todo el cuadro desde el principio: los equipos y quién enfrenta a quién.
              Los ganadores avanzan por el cuadro y no se vuelve a sortear.
            </li>
            <li>
              Si la cantidad de equipos no es 8, 16 o 32, hay una ronda previa y algunos equipos
              pasan directo. Se explica con ejemplos justo debajo.
            </li>
          </ul>
        </section>

        <section>
          <h2>Ronda previa y pases directos</h2>
          <p>
            El cuadro tiene que cerrar en 8, 16 o 32 equipos para que todos lleguen parejos a los
            cuartos de final, la semifinal y la final. Cuando la cantidad de equipos es otra, hay una
            ronda previa.
          </p>
          <ul>
            <li>
              En la ronda previa juegan solo los equipos necesarios para dejar el cuadro completo.
              Todos los demás pasan directo a la ronda siguiente, sin jugar la previa.
            </li>
            <li>
              Ejemplo con 10 equipos (20 jugadores): 4 equipos juegan la ronda previa, en 2
              partidos. Los otros 6 pasan directo a los cuartos de final. En los cuartos quedan 8
              equipos: los 6 que pasaron directo y los 2 ganadores de la previa.
            </li>
            <li>
              Ejemplo con 12 equipos: 8 equipos juegan la ronda previa, en 4 partidos, y los otros 4
              pasan directo.
            </li>
            <li>
              Si hay exactamente 8, 16 o 32 equipos, no hay ronda previa y todos juegan desde la
              primera ronda.
            </li>
            <li>
              Quién juega la ronda previa y quién pasa directo lo decide el sorteo, al azar, antes de
              empezar. Es igual para todos y no se cambia después.
            </li>
            <li>
              Pasar directo no es un premio ni un castigo: es lo que sale del sorteo. Quien juega la
              ronda previa juega un partido más, y quien pasa directo se lo salta.
            </li>
          </ul>
        </section>

        <section>
          <h2>La final</h2>
          <ul>
            <li>
              La final se puede jugar de dos formas: una sola partida a 40 puntos, o al mejor de 3
              partidas.
            </li>
            <li>
              Al mejor de 3 gana la pareja que gane 2 partidas, cada una a 40 puntos. Si una pareja
              gana las dos primeras, no se juega la tercera.
            </li>
            <li>
              Es opcional: se juega al mejor de 3 solo si las dos parejas de la final están de acuerdo
              antes de empezar. Si no, se juega una sola partida.
            </li>
            <li>Esto vale solo para la final. En todas las demás rondas se juega una sola partida.</li>
          </ul>
        </section>

        <section>
          <h2>Jugadores y turnos</h2>
          <ul>
            <li>
              Juegan dos parejas. Los jugadores se sientan de forma alternada: cada uno queda entre
              los dos rivales y frente a su compañero.
            </li>
            <li>Los turnos giran en sentido contrario a las agujas del reloj.</li>
            <li>
              El Juez de Aguas no juega. Verifica las rondas y da los puntos, cuenta las cartas al
              final y resuelve las protestas.
            </li>
          </ul>
        </section>

        <section>
          <h2>Baraja y reparto</h2>
          <ul>
            <li>
              40 cartas: del A al 7, más la J, la Q y la K, en los cuatro palos. Los 8, 9 y 10 no se
              juegan: sirven para anotar puntos.
            </li>
            <li>
              Quién reparte primero: el Juez de Aguas baraja y cada jugador levanta una carta. El as
              vale 1, las figuras valen 10 y las demás su número. La pareja que suma más reparte y
              elige quién de los dos lo hace.
            </li>
            <li>
              Quien reparte baraja y deja el mazo en la mesa. Su rival de la izquierda lo parte, es
              decir, lo corta sin barajar. Luego se reparten 5 cartas seguidas a cada jugador,
              empezando por el rival de la derecha.
            </li>
            <li>Cuando se acaban las cartas de los jugadores, se reparten otras 5 a cada uno, hasta jugar las 40.</li>
            <li>El Juez de Aguas da la orden de empezar. La primera carta la tira el jugador a la derecha de quien repartió.</li>
          </ul>
        </section>

        <section>
          <h2>Cómo se levantan cartas</h2>
          <p>
            En tu turno tiras una sola carta a la mesa. Si con ella puedes levantar cartas, te las
            llevas junto con la tuya. Si no puedes, tu carta se queda en la mesa. Si hay varias
            formas de levantar, eliges una. Si alguien tira más de una carta, elige cuál juega en ese
            turno y recoge las otras.
          </p>
          <dl>
            <dt>Igualando</dt>
            <dd>
              Tiras una carta del mismo número que otra de la mesa y te llevas esa carta. Ejemplo:
              en la mesa hay un 5, tiras un 5 y te llevas el 5. También sirve con figuras: una J
              levanta una J. El palo no importa.
            </dd>
            <dt>Sumando</dt>
            <dd>
              Tiras una carta del A al 7 y te llevas las cartas de la mesa que sumen su valor. El as
              vale 1. Ejemplo: en la mesa hay un 6 y un as, tiras un 7 y te llevas el 6 y el as
              (6 + 1 = 7). Las figuras no se pueden sumar.
            </dd>
            <dt>Escalera</dt>
            <dd>
              Cuando levantas igualando o sumando, también puedes llevarte las cartas que siguen en
              orden, sin que falte ninguna en medio. Ejemplo: en la mesa hay 3, 4, 5, 6, 7, J y K,
              tiras un 3 y te llevas el 3 igualando, y también el 4, el 5, el 6, el 7 y la J. La K
              no, porque falta la Q. La escalera no se puede levantar sola: siempre va con una de
              las otras dos jugadas.
            </dd>
          </dl>
        </section>

        <section>
          <h2>Puntos</h2>
          <dl>
            <dt>Caída: 2</dt>
            <dd>
              Tu carta levanta, por igualdad, la carta que el jugador anterior acaba de tirar. El
              Juez de Aguas da los 2 puntos. Siempre cuenta, incluso desde los 30 puntos.
            </dd>
            <dt>Limpia: 2</dt>
            <dd>
              Levantas todas las cartas de la mesa. Desde los 30 puntos la limpia ya no suma.
            </dd>
            <dt>Caída y limpia: 2</dt>
            <dd>
              Con una carta igual a la que acaba de tirar el jugador anterior, levantas todas las
              cartas de la mesa. Vale 2 puntos en total, no 4. Desde los 30 puntos sigue valiendo 2,
              porque cuenta como caída.
            </dd>
            <dt>Ronda: 2</dt>
            <dd>
              Después de repartir, recibes tres cartas del mismo número o figura. Pide los puntos
              antes de tirar tu primera carta, con la frase que quieras, por ejemplo &ldquo;dos por
              guapo&rdquo;. El Juez de Aguas verifica la ronda y da los puntos. Desde los 30 puntos
              la ronda ya no suma.
            </dd>
            <dt>Cartón: desde 6</dt>
            <dd>
              Al jugar las 40 cartas, el Juez de Aguas retira las que quedaron en la mesa y cada
              pareja cuenta las que levantó. Con 20 cartas levantadas son 6 puntos, con 21 son 7,
              con 22 son 8, con 23 son 9, y así sigue. Si el total sale impar, se sube al par
              siguiente: 7 pasa a 8, 9 pasa a 10, 11 pasa a 12. Con 19 cartas o menos no hay puntos
              de cartón.
            </dd>
            <dt>Dos por dar: 2</dt>
            <dd>
              Si ninguna pareja llega a 20 cartas y las dos levantaron la misma cantidad, la pareja
              que reparte a continuación recibe 2 puntos.
            </dd>
            <dt>Dos por falla: 2</dt>
            <dd>
              La pareja que no levantó ni una carta da 2 puntos a la pareja contraria.
            </dd>
          </dl>
        </section>

        <section>
          <h2>Ganar al instante</h2>
          <p>Una pareja gana el partido de inmediato en cualquiera de estos casos:</p>
          <ul>
            <li>Un jugador recibe en el reparto las 4 cartas del mismo número.</li>
            <li>La pareja hace 4 caídas seguidas, 2 a cada uno de los rivales.</li>
          </ul>
        </section>

        <section>
          <h2>38 puntos</h2>
          <p>
            Cuando una pareja llega a 38 puntos, solo puede ganar con una caída. Ya no suma puntos
            por el conteo de cartas.
          </p>
        </section>

        <section>
          <h2>Errores y protestas</h2>
          <dl>
            <dt>Cartas mal repartidas</dt>
            <dd>
              Si se nota que las cartas se repartieron mal, se detiene el juego y la pareja contraria
              a la que repartió recibe 10 puntos. Se llama &ldquo;pasa la mano con 10&rdquo;. Esa
              pareja reparte de nuevo y el juego sigue.
            </dd>
            <dt>Cartas no levantadas</dt>
            <dd>
              Si un jugador pudo levantar más cartas y su compañero tampoco se dio cuenta, la pareja
              rival puede retirarlas para ella. Si nadie las retira, quedan en la mesa.
            </dd>
            <dt>Veo y juego</dt>
            <dd>
              Si dudas de un levante de tus rivales, pides &ldquo;veo y juego&rdquo; al Juez de
              Aguas, que lo verifica. Si el levante estaba mal, se quitan 2 puntos a la pareja que
              se equivocó y se dan a la que reclamó. Si estaba bien, se quitan 2 puntos a la pareja
              que protestó.
            </dd>
          </dl>
        </section>

        <section>
          <h2>Anotar los puntos</h2>
          <p>
            Los 8, 9 y 10 sirven de marcadores. Por un lado cada carta vale 2 puntos (un tanto) y por
            el otro vale 10 (un perro). Cinco tantos son un perro, y cuatro perros son los 40 puntos.
          </p>
        </section>

        <section>
          <h2>Resultado</h2>
          <ul>
            <li>Gana quien llega a 40 puntos o más. Si ambos pasan de 40, gana quien tenga más.</li>
            <li>No hay empates.</li>
            <li>
              El organizador anota en la página solo el marcador final de cada partido. Si la final
              se juega al mejor de 3, anota el marcador de cada partida. Los puntos durante el juego
              se llevan en la mesa.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
