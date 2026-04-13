# Prompt: Análisis, Optimización y Corrección del Proyecto Cotizador-App

> **Uso**: Copia este prompt completo y pégalo en una nueva conversación con Claude Code para ejecutar el análisis.

---

## Instrucciones

Eres un auditor senior de código. Realiza un análisis exhaustivo del proyecto **cotizador-app** — una aplicación Next.js 16 + React 19 + PostgreSQL para gestión de cotizaciones empresariales (marca LUMI). El proyecto usa App Router, iron-session, raw SQL (pg), Tailwind CSS 4, y @react-pdf/renderer.

### Alcance del análisis

Analiza **cada archivo** del proyecto en las siguientes categorías. Para cada hallazgo, indica:
- **Archivo y línea** exacta
- **Severidad**: 🔴 Crítico | 🟠 Alto | 🟡 Medio | 🔵 Bajo
- **Problema** detectado
- **Solución** concreta con código

---

## 1. SEGURIDAD (Prioridad máxima)

Revisa todos los archivos en `app/api/` y `lib/`:

- [ ] **Inyección SQL**: Buscar concatenación de strings en queries SQL. Verificar que TODOS los valores usen `$1, $2...` parameterizados. Revisar especialmente `lib/queries/*.ts`
- [ ] **Autenticación/Autorización**: Verificar que CADA ruta API llame `getSession()` y valide roles. Buscar rutas sin protección en `app/api/`
- [ ] **RBAC incompleto**: ¿Un `sales` puede acceder a endpoints de `admin`? ¿Se valida el rol en cada operación sensible?
- [ ] **Exposición de datos**: ¿Se filtran passwords u otros campos sensibles en respuestas JSON? Revisar que `password_hash` nunca se envíe al cliente
- [ ] **CSRF/XSS**: Revisar manejo de inputs del usuario, sanitización de HTML
- [ ] **Secretos hardcodeados**: Buscar passwords, tokens o secretos en código fuente (no solo .env)
- [ ] **Session config**: Validar que `SESSION_SECRET` tenga longitud adecuada, que secure=true en producción
- [ ] **Rate limiting**: ¿Existe protección contra brute force en `/api/auth/login`?
- [ ] **Validación de entrada**: ¿Se validan tipos, longitudes y formatos de datos en cada endpoint?

## 2. ERRORES Y BUGS

Revisa todos los archivos `.ts` y `.tsx`:

- [ ] **Manejo de errores**: Buscar `try/catch` faltantes en operaciones async, especialmente en queries a DB
- [ ] **Race conditions**: Operaciones de lectura-escritura no atómicas en la DB
- [ ] **Memory leaks**: Conexiones de DB no liberadas, listeners no removidos en useEffect
- [ ] **Tipos incorrectos**: `any` excesivo, tipos que no coinciden con la realidad del dato
- [ ] **Null/undefined no manejados**: Accesos a propiedades sin verificación
- [ ] **Estados inconsistentes**: Máquinas de estado de quotes/projects con transiciones inválidas
- [ ] **Errores silenciosos**: `catch` vacíos que tragan errores sin logging
- [ ] **Dependencias de useEffect**: Arrays de dependencias incorrectos o faltantes
- [ ] **Imports no usados**: Código muerto o imports que ya no se usan

## 3. RENDIMIENTO

- [ ] **Queries N+1**: Buscar loops que ejecutan queries individuales en vez de batch/JOIN
- [ ] **Pool de conexiones**: Verificar configuración del pool en `lib/db.ts` — ¿max connections? ¿idle timeout?
- [ ] **Índices faltantes**: Comparar queries frecuentes en `lib/queries/` con índices definidos en `db/init.sql`
- [ ] **Componentes pesados**: Componentes cliente que podrían ser server components
- [ ] **Re-renders innecesarios**: Falta de `useMemo`, `useCallback` donde hay cálculos costosos
- [ ] **Bundle size**: Imports de librerías completas vs tree-shaking (ej: `xlsx`)
- [ ] **Imágenes no optimizadas**: ¿Se usa `next/image` correctamente?
- [ ] **Fetching redundante**: ¿Se hacen las mismas peticiones API múltiples veces?
- [ ] **Caching**: ¿Se aprovechan las capacidades de cache de Next.js en rutas API y fetch?

## 4. ARQUITECTURA Y PATRONES

- [ ] **Código duplicado**: Buscar lógica repetida entre archivos similares (ej: admin pages vs manager pages)
- [ ] **Separación de responsabilidades**: ¿Hay lógica de negocio mezclada en componentes UI?
- [ ] **Consistencia de API responses**: ¿Todas las rutas siguen el mismo patrón de respuesta?
- [ ] **Manejo de estado**: ¿Se usa un patrón consistente para estado del cliente?
- [ ] **Reutilización de componentes**: ¿Hay componentes que se podrían extraer y compartir?
- [ ] **Convenciones de nombrado**: ¿Son consistentes los nombres de archivos, funciones y variables?
- [ ] **Tipado**: ¿Hay interfaces/types centralizados o están dispersos por el proyecto?
- [ ] **Queries layer**: ¿El layer de queries es consistente? ¿Todas las funciones siguen el mismo patrón?

## 5. CALIDAD DE CÓDIGO

- [ ] **Funciones demasiado largas**: Funciones >50 líneas que deberían dividirse
- [ ] **Complejidad ciclomática**: Anidación excesiva de if/else/switch
- [ ] **Magic numbers/strings**: Valores hardcodeados que deberían ser constantes
- [ ] **Lógica de negocio en rutas API**: ¿Debería extraerse a servicios?
- [ ] **Manejo de formularios**: ¿Es consistente el patrón de validación y envío?
- [ ] **Error boundaries**: ¿Existen para manejar errores en el rendering?
- [ ] **Loading/error states**: ¿Todos los componentes manejan estados de carga y error?

## 6. BASE DE DATOS

Revisa `db/init.sql` y `lib/queries/*.ts`:

- [ ] **Esquema**: ¿Faltan constraints (NOT NULL, CHECK, UNIQUE)?
- [ ] **Índices**: ¿Cubren las queries más frecuentes?
- [ ] **Migraciones**: ¿Hay un sistema de migraciones o solo init.sql?
- [ ] **Normalización**: ¿Hay datos redundantes entre tablas?
- [ ] **Transacciones**: ¿Las operaciones multi-tabla usan transacciones?
- [ ] **Soft delete vs hard delete**: ¿Es consistente la estrategia?
- [ ] **Timestamps**: ¿Todas las tablas tienen created_at/updated_at?
- [ ] **Audit trail**: ¿Se registran cambios importantes en audit_events?

## 7. UX Y ACCESIBILIDAD

- [ ] **Accesibilidad**: ARIA labels, roles, focus management, keyboard navigation
- [ ] **Responsive design**: ¿Funciona en mobile? Revisar breakpoints de Tailwind
- [ ] **Estados vacíos**: ¿Qué muestra cuando no hay datos?
- [ ] **Feedback al usuario**: ¿Hay indicadores de carga, confirmaciones, mensajes de error claros?
- [ ] **Manejo de formularios largos**: ¿Se preserva el estado en caso de error?

## 8. DEVOPS Y CONFIGURACIÓN

- [ ] **Docker**: ¿El Dockerfile es óptimo? Multi-stage build, .dockerignore
- [ ] **Variables de entorno**: ¿Se validan al inicio? ¿Hay fallbacks inseguros?
- [ ] **Testing**: No hay tests — recomendar estrategia de testing
- [ ] **Linting**: Solo Prettier, no ESLint — recomendar configuración
- [ ] **CI/CD**: No hay pipeline — recomendar configuración básica
- [ ] **Logging**: ¿Hay logging estructurado para producción?
- [ ] **Error monitoring**: ¿Se capturan errores en producción (Sentry, etc.)?

---

## Formato de entrega

Organiza los hallazgos en una tabla por categoría:

| # | Severidad | Archivo:Línea | Problema | Solución |
|---|-----------|---------------|----------|----------|
| 1 | 🔴 | `lib/queries/quotes.ts:45` | SQL injection en filtro | Usar parámetro `$N` |

Al final, incluye:
1. **Resumen ejecutivo**: Top 10 problemas más críticos a resolver de inmediato
2. **Plan de acción**: Orden recomendado de corrección (agrupar por dependencias)
3. **Quick wins**: Mejoras que se pueden aplicar en <5 minutos cada una
4. **Deuda técnica**: Lista de mejoras a mediano plazo

---

## Notas técnicas del proyecto

- **Next.js 16.2.1** — Verificar si hay APIs deprecadas de versiones anteriores
- **React 19** — Verificar uso correcto de Server/Client Components
- **No hay ORM** — SQL directo con `pg`, revisar cada query manualmente
- **Roles**: admin, manager, sales — cada uno con permisos diferentes
- **Estados de cotización**: draft → sent → confirmed/cancelled/expired
- **Estados de proyecto**: draft → process → approved → demo → follow_up → closed/deleted

Comienza el análisis leyendo TODOS los archivos del proyecto sistemáticamente. No asumas nada — lee el código real.
