# Diario de viaje

Web estática para llevar el itinerario y los gastos de un viaje entre varias personas.
Sin servidor y sin base de datos: los datos son ficheros JSON en este mismo repositorio,
y la web los lee y escribe con la API de GitHub.

## Cómo está montado

```
app/
  index.html      armazón
  app.js          motor: no sabe nada de ningún viaje concreto
  style.css
  sw.js           service worker, para que abra sin cobertura
  manifest.json
data/
  sudafrica-2026/
    viaje.json           itinerario, reservas, monedas   ← lo edita Claude
    gastos-alvaro.json   gastos de Álvaro                ← los escribe la app
    gastos-laura.json    gastos de Laura                 ← los escribe la app
```

**Un fichero de gastos por persona.** Cada uno escribe solo en el suyo y la web los
junta al leer. Es lo que evita los conflictos de edición: nunca dos personas tocan
el mismo fichero.

## Puesta en marcha

1. Crea un repositorio **público** llamado `viajes` y sube estas carpetas.
2. En *Settings → Pages*, publica desde la rama `main`, carpeta raíz.
3. La web queda en `https://TU-USUARIO.github.io/viajes/app/`

Si prefieres repositorio privado también funciona, pero entonces Pages exige plan de
pago y las dos personas necesitan token solo para leer. Público es más simple; ten en
cuenta que el itinerario y los importes quedan a la vista de cualquiera que dé con la URL.

## Token de acceso

Cada uno, en su móvil, entra en *Ajustes* dentro de la web y rellena usuario,
repositorio y token.

Para crear el token: **github.com → Settings → Developer settings →
Personal access tokens → Fine-grained tokens → Generate new token**

- *Repository access*: solo `viajes`
- *Permissions → Repository permissions → Contents*: **Read and write**
- Caducidad: la fecha de vuelta del viaje

El token se guarda únicamente en el navegador del teléfono. Si pierdes el móvil,
revócalo desde GitHub: no da acceso a nada más que a ese repositorio.

Laura necesita ser colaboradora del repositorio (*Settings → Collaborators*) para
que su token pueda escribir.

## Uso diario

- **Hoy** — dónde duermes, qué toca a continuación, gasto del día.
- **Ruta** — el itinerario por tramos.
- **Gastos** — apuntar. Sin cobertura se queda en cola y sube solo al recuperar red.
- **Dinero** — reservas, gasto real, por categoría y por persona.
- **Datos** — números de reserva y avisos.
- **Ajustes** — quién eres y conexión al repositorio.

En el móvil, «Añadir a pantalla de inicio» la deja como una app.

## Añadir otro viaje

Crea `data/mi-viaje/` con su `viaje.json` y un `gastos-<persona>.json` vacío (`[]`)
por viajero. Entra con `?viaje=mi-viaje`. El motor no cambia.

### Formato de `viaje.json`

| Clave | Para qué |
|---|---|
| `monedaBase`, `cambios` | moneda de referencia y equivalencias |
| `viajeros` | quién puede apuntar y en qué fichero |
| `bases` | dónde duermes cada día, para la placa de arriba |
| `franjas` | avisos con fecha, como el horario de puertas del parque |
| `tramos` → `dias` → `eventos` | el itinerario |
| `reservas` | lo contratado, con `estado` pagado o pendiente |
| `referencias` | tablas de datos sueltos y notas |

Un evento con `"clave": true` sale en negrita. Un día con `"aviso"` muestra el recuadro rojo.

## Sobre los importes

Los cambios de moneda son los de `viaje.json`, no los reales de la tarjeta. Sirven
para orientarte durante el viaje; para cuadrar de verdad, usa el extracto al volver.
