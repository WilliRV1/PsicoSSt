# Skills instalados en este proyecto

`emilkowalski/skills` no es un marketplace de Claude Code, es un repositorio de
skills sueltos, así que se copian aquí para que Claude los cargue en cualquier
sesión abierta sobre este repositorio. Son trece, todos Markdown: ningún script,
ningún hook, nada que se ejecute.

| Skill | Para qué |
|---|---|
| `emil-design-eng` | Las 43 reglas de ingeniería de interfaz: duraciones, curvas, cuándo no animar |
| `animate` | Añadir movimiento con intención |
| `improve-animations` | Revisar y corregir animaciones existentes |
| `review-animations` | Auditoría de movimiento |
| `find-animation-opportunities` | Dónde cabe una animación y dónde no |
| `animation-vocabulary` | El vocabulario común para hablar de motion |
| `apple-design` | Criterios de Human Interface Guidelines |
| `prototype` | Prototipado rápido |
| `pick-ui-library` | Elegir librería de componentes |
| `ask-sonner` | Uso de Sonner (ya es dependencia de este proyecto) |
| `mobile-native`, `animate-expo`, `write-swift` | Móvil nativo; aquí no aplican |

Los otros dos —**impeccable** y **taste-skill**— sí son marketplaces y se
declaran en `.claude/settings.json` (`extraKnownMarketplaces` + `enabledPlugins`),
así que Claude Code los descarga y actualiza solo.

## Procedencia

| Fuente | Repositorio | Licencia |
|---|---|---|
| Emil Kowalski | `emilkowalski/skills` | MIT |
| Impeccable | `pbakaus/impeccable` | Apache 2.0 |
| Taste Skill | `hestudy/taste-skill-claude-marketplace` | MIT |

Son de terceros: sus instrucciones entran en el contexto de Claude en cada sesión
de este repositorio. Si alguna vez quieres revertirlo, borra este directorio y las
dos claves de `.claude/settings.json`.

> El skill de Impeccable propone ejecutar `scripts/impeccable context`, que
> descarga y corre un binario propio. No se ejecutó al construir el diseño: sus
> reglas se aplicaron leyendo los archivos de referencia del repositorio.
