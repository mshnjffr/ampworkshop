# Taller de Amp: Aprende Haciendo

¡Bienvenido al taller interactivo de Amp! Este repositorio práctico contiene 6 ejercicios principales y 1 desafío adicional diseñados para enseñarte las poderosas capacidades de programación con IA de Amp a través de desafíos prácticos.

## 🚀 Configuración Rápida

```bash
# Clona este repositorio
git clone <repository-url>
cd amp-workshop

# Verifica tu entorno
npm run verify

# Instala todas las dependencias (¡un comando para todo!)
npm run setup-all
```

## 📋 Prerrequisitos

- **Node.js >= 18.0.0** y **npm >= 8.0.0**
- **Git**
- **Amp** (extensión de VS Code o CLI)
- macOS/Linux o Windows con bash

## 🗂️ Estructura del Repositorio

```
amp-workshop/
├── apps/                    # Ejercicios principales (01-06)
│   ├── 01-hello-amp/       # Ejercicio de calentamiento
│   ├── 02-broken-todo/     # Depura una app React
│   ├── 03-mystery-codebase/# Explora código desconocido
│   ├── 04-build-refactor/  # Construye y refactoriza
│   ├── 05-test-coverage/   # Generación de pruebas
│   └── 06-automate-ui/     # Automatización del navegador
├── stretch-goals/           # Desafíos avanzados
│   └── parallel-processing/ # Agentes paralelos
└── scripts/                 # Scripts auxiliares
```

## 🎯 Ejercicios Principales

### Ejercicio 01: Hola Amp
**Objetivo:** Familiarízate con los conceptos básicos de Amp
```bash
cd apps/01-hello-amp
npm start  # Visita http://localhost:3000
```
**Tarea:** ¡Pide a Amp que haga la aplicación interactiva!

### Ejercicio 02: Todo Roto
**Objetivo:** Corrige errores en una aplicación React TypeScript
```bash
cd apps/02-broken-todo
npm start  # Corrige la aplicación todo rota
npm test   # Haz que todas las pruebas pasen
```

### Ejercicio 03: Base de Código Misteriosa
**Objetivo:** Explora y comprende código desconocido
```bash
cd apps/03-mystery-codebase
npm start  # Descubre qué hace esta API
```
**Desafío:** ¡Crea documentación de la API sin conocimiento previo!

### Ejercicio 04: Construir y Refactorizar
**Dos Partes:**
- **Parte A:** Construye una API REST desde cero
- **Parte B:** Refactoriza código heredado a estándares modernos
```bash
cd apps/04-build-refactor/part-b-refactor
npm start  # Ejecuta la aplicación heredada
```

### Ejercicio 05: Cobertura de Pruebas
**Objetivo:** Genera pruebas comprensivas para alcanzar 80%+ de cobertura
```bash
cd apps/05-test-coverage
npm test              # Ejecuta las pruebas
npm run test:coverage # Verifica la cobertura (comienza en 0%)
```

### Ejercicio 06: Automatización del Navegador
**Objetivo:** Automatiza las pruebas de UI con las herramientas de navegador de Amp
```bash
cd apps/06-automate-ui
npm start  # Sirve en http://localhost:3000
```
**Tarea:** ¡Haz que Amp pruebe la validación del formulario automáticamente!

## 🌟 Desafío Adicional

### Procesamiento Paralelo
**Objetivo:** Usa múltiples agentes Amp trabajando en paralelo
```bash
cd stretch-goals/parallel-processing
```
**Desafío:** ¡Estiliza 10 componentes simultáneamente usando la herramienta Task!

## 🛠️ Comandos Útiles

Desde la raíz del repositorio:
```bash
npm run verify      # Verifica tu entorno
npm run setup-all   # Instala todas las dependencias
npm run reset-all   # Reinicia los ejercicios al estado inicial
```

Desde cada directorio de ejercicio:
```bash
npm start           # Ejecuta la aplicación
npm test            # Ejecuta las pruebas
npm run dev         # Modo de desarrollo (donde esté disponible)
```

## 💡 Consejos para el Éxito

1. **Comienza Simple:** Empieza con el Ejercicio 01 y progresa secuencialmente
2. **Lee los READMEs:** Cada ejercicio tiene instrucciones específicas
3. **Usa Amp Activamente:** No solo corrijas errores—pide a Amp que explique, refactorice y mejore
4. **Experimenta:** Prueba diferentes estrategias de prompts
5. **Poder Paralelo:** Para el Ejercicio 05 y el desafío adicional, usa la herramienta Task de Amp para ejecución paralela

## 🎓 Flujo del Taller

Flujo sugerido:
- Introducción y verificación de configuración
- Ejercicios prácticos (1–6)
- Desafío adicional opcional

## 📚 Recursos

- **Manual de Amp:** https://ampcode.com/manual
- **Extensión de VS Code:** Busca "Amp by Sourcegraph" en el marketplace
- **Soporte del Taller:** Revisa AGENTS.md para las convenciones del proyecto

## 🚦 Comenzando

1. Abre VS Code en el directorio del taller
2. Comienza con el Ejercicio 01
3. Abre el chat de Amp y di: "Empecemos con el ejercicio 01"
4. ¡Sigue la guía de Amp y experimenta!

---

**Recuerda:** El objetivo no es solo completar los ejercicios—es explorar las capacidades de Amp. ¡Prueba diferentes enfoques, haz preguntas y diviértete aprendiendo!

## 🧰 Cajas de Herramientas (Amp CLI)

Las cajas de herramientas permiten que Amp ejecute pequeños ejecutables locales sin un servidor MCP. Este taller incluye un verificador de fin de vida que puedes llamar desde el CLI antes de comenzar.

- Ubicación: [`.agents/toolbox/end_of_life.py`](/amp-workshop/.agents/toolbox/end_of_life.py#L1-L200)
- Requiere: Python 3 (solo stdlib)

### Configuración

```bash
# Desde la raíz del repositorio
export AMP_TOOLBOX="$PWD/amp-workshop/.agents/toolbox"
# Si agregas nuevos scripts, hazlos ejecutables
chmod +x amp-workshop/.agents/toolbox/*
```

### Verificar el estado del runtime de Node (antes de ejecutar ejercicios)

Pide a Amp (CLI) que use la caja de herramientas para verificar Node.js en endoflife.date, luego resume:

```bash
amp -x "Usa la caja de herramientas end_of_life para verificar la información EOL de Node.js (producto: nodejs). Resume las fechas actuales de LTS y EOL y dime si Node 18 está bien para este taller."
```

### Reporte EOL de todo el monorepo (ejemplo opcional)

Puedes agregar una caja de herramientas auxiliar (workshop_eol_report.py) que escanee el repositorio en busca de runtimes comunes (nodejs, sqlite, mysql, react) y llame a endoflife.date para un reporte consolidado.

- Ruta sugerida: `amp-workshop/.agents/toolbox/workshop_eol_report.py`
- Después de agregarlo y hacerlo ejecutable, ejecuta:

```bash
amp -x "Ejecuta workshop_eol_report en este repositorio y resume qué productos están cerca del EOL dentro de 90 días."
```

Consejo: Mantén los scripts de la caja de herramientas solo con stdlib y locales al repositorio. Son excelentes para verificaciones repetibles como validación de entorno, escaneos de rendimiento/seguridad y ayudantes de base de datos de desarrollo.
