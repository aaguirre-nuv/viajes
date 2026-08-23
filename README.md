# Diario de viaje

Web estática para llevar el itinerario, el diario y los gastos de un viaje entre varias
personas. Sin servidor y sin base de datos: los datos son ficheros JSON en este mismo
repositorio, y la web los lee y escribe con la API de GitHub.

## Cómo está montado

```
app/
  index.html      la aplicación entera: armazón, estilos y motor en un solo fichero
  sw.js           service worker, para que abra sin cobertura
  manifest.json
data/
  sudafrica-2026/
    viaje.json           itinerario, zonas, lugares, reservas   ← se edita a mano
    track.json           recorrido real del viaje              ← se genera una vez
    gastos-alvaro.json   gastos de Álvaro                      ← los escribe la app
    gastos-laura.json    gastos de Laura                       ← los escribe la app
    diario-alvaro.json   diario de Álvaro                      ← los escribe la app
    diario-laura.json    diario de Laura                       ← los escribe la app
```

**Un solo fichero para la app.** `index.html` lleva dentro el HTML, el CSS y el
JavaScript. No hay build, ni dependencias, ni `npm`. Se edita, se sube, y está
publicado. La única librería externa es Leaflet, y se descarga desde CDN solo cuando
se abre la pestaña Mapa.

**Un fichero de gastos y otro de diario por persona.** Cada uno escribe solo en los
suyos y la web los junta al leer. Es lo que evita los conflictos de edición: nunca dos
personas tocan el mismo fichero.

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

Quien vaya a escribir necesita ser colaborador del repositorio
(*Settings → Collaborators*). Quien solo vaya a consultar no necesita token ninguno.

## Uso diario

| Pestaña | Para qué |
|---|---|
| **Hoy** | dónde duermes, qué toca a continuación, gasto del día |
| **Ruta** | el itinerario completo por tramos |
| **Mapa** | los lugares sobre el mapa, filtrables por día |
| **Diario** | apuntes del viaje, con etiquetas y por persona |
| **Gastos** | apuntar. Sin cobertura se queda en cola y sube solo al recuperar red |
| **Dinero** | reservas, gasto real, por categoría y por persona |
| **Detalle** | todos los movimientos, ordenables |
| **Datos** | números de reserva, avisos y enlaces útiles |
| **Ajustes** | quién eres y conexión al repositorio |

En el móvil, «Añadir a pantalla de inicio» la deja como una app.

**Sin cobertura** funciona todo salvo el Mapa, que necesita descargar las teselas de
OpenStreetMap. Lo que apuntes se guarda en el teléfono y sube solo al volver la red.

## Añadir otro viaje

Crea `data/mi-viaje/` con su `viaje.json`, y un `gastos-<persona>.json` y un
`diario-<persona>.json` vacíos (`[]`) por viajero. Entra con `?viaje=mi-viaje`.
El motor no cambia.

### Formato de `viaje.json`

| Clave | Para qué |
|---|---|
| `version` | `YYYY-MM-DD.n`, para saber qué versión está publicada |
| `monedaBase`, `cambios` | moneda de referencia y equivalencias |
| `viajeros` | quién puede apuntar y en qué fichero |
| `bases` | dónde duermes cada día, para la placa de arriba |
| `zonas` | áreas geográficas del viaje, con nombre y color |
| `lugares` | puntos con coordenadas, cada uno asignado a una zona |
| `franjas` | avisos con fecha, como el horario de puertas del parque |
| `tramos` → `dias` → `eventos` | el itinerario |
| `reservas` | lo contratado, con `estado` pagado o pendiente |
| `referencias` | tablas de datos sueltos y notas |
| `etiquetasDiario` | las etiquetas que ofrece el Diario |

Un evento con `"clave": true` sale en negrita. Uno con `"pte": true` aparece en naranja,
como no contratado. Un día con `"aviso"` muestra el recuadro rojo.

### Geografía: base, zona y lugar

Son tres niveles distintos y conviene no mezclarlos:

- **Base** — dónde duermes. Una por día, en `bases`.
- **Zona** — el área donde te mueves ese día. No tiene por qué coincidir con la base:
  puedes dormir en Ciudad del Cabo y pasar el día en la Península del Cabo.
- **Lugar** — el punto concreto, con coordenadas. Vive en `lugares` y se referencia
  desde un evento con `"lugar": "clave-del-lugar"`.

```json
"zonas": {
  "peninsula": { "nombre": "Península del Cabo", "color": "#1E6B7A" }
},
"lugares": {
  "playa-de-boulders": {
    "nombre": "Playa de Boulders",
    "zona": "peninsula",
    "lat": -34.195615, "lon": 18.450359,
    "placeID": "ChIJKeByCDY-zB0RECn0gAHgvHw"
  }
}
```

Un lugar con `"menor": true` se dibuja más pequeño: es una parada de paso, no un
destino. Uno con `"fuente": "manual"` no salió del recorrido grabado sino que se
añadió a mano.

Cada día lleva su `zona` (la principal), `zonas` (todas las que tocó) y `lugares`
(la lista de claves, en orden de visita). Eso permite pintar el mapa de un día sin
tener que cargar `track.json`.

### De dónde salen las coordenadas

Los `lugares` de Sudáfrica se generaron a partir de la cronología de Google Maps:

1. Exportar la cronología desde el móvil (*Google Maps → perfil → Ajustes →
   Contenido personal → Exportar datos de la cronología*). Sale un `location-history.json`.
2. Recortar a las fechas del viaje y agrupar las visitas por `placeID`.
3. Resolver cada `placeID` a su nombre con la API de Places (New) de Google.

El paso 3 hace falta porque **el export no contiene nombres**: cada visita trae
coordenada y `placeID`, pero el nombre no aparece en ningún campo. Corregir los sitios
dentro de Google Maps mejora el `placeID`, no añade el nombre.

### `track.json`

El recorrido real, exportado desde la misma cronología y recortado a las fechas del
viaje. Solo se descarga al pulsar «Traza real» en el Mapa, porque pesa bastante más
que el resto.

**El export completo de la cronología no se sube nunca.** Contiene años de historial
—casa, trabajo, todo— y este repositorio es público. Al repo va únicamente la ventana
de fechas del viaje.

## Sobre los importes

Los cambios de moneda son los de `viaje.json`, no los reales de la tarjeta. Sirven
para orientarte durante el viaje; para cuadrar de verdad, usa el extracto al volver.
