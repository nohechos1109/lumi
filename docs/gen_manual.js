const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, TableOfContents, LevelFormat,
} = require('docx');
const fs = require('fs');

// ── Colors ───────────────────────────────────────────────────────────────────
const NAVY  = '1B3461';
const SKY   = '0EA5E9';
const WHITE = 'FFFFFF';
const LIGHT = 'EFF4FB';
const GRAY  = 'F3F4F6';
const GREEN = '16A34A';
const RED   = 'DC2626';
const DASH  = '6B7280';
const TEXT  = '1F2937';

// ── Borders helpers ───────────────────────────────────────────────────────────
const bSingle = (color = 'CCCCCC') => ({ style: BorderStyle.SINGLE, size: 1, color });
const bAll    = (c = 'CCCCCC') => ({ top: bSingle(c), bottom: bSingle(c), left: bSingle(c), right: bSingle(c) });
const bNone   = () => ({ style: BorderStyle.NONE, size: 0, color: 'FFFFFF' });
const bNoneAll = () => ({ top: bNone(), bottom: bNone(), left: bNone(), right: bNone() });
const cellPad  = { top: 100, bottom: 100, left: 140, right: 140 };

// ── Basic elements ────────────────────────────────────────────────────────────
function spacer(after = 120) {
  return new Paragraph({ children: [], spacing: { before: 0, after } });
}
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, font: 'Arial', size: 28, bold: true, color: NAVY })],
    spacing: { before: 360, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: SKY, space: 4 } },
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, font: 'Arial', size: 22, bold: true, color: NAVY })],
    spacing: { before: 240, after: 100 },
  });
}
function p(text, extra = {}) {
  return new Paragraph({
    children: [new TextRun({ text, font: 'Arial', size: 21, color: TEXT, ...extra })],
    spacing: { before: 0, after: 80 },
  });
}
function pMixed(runs, after = 80) {
  return new Paragraph({ children: runs, spacing: { before: 0, after } });
}
function R(text, extra = {}) { return new TextRun({ text, font: 'Arial', size: 21, color: TEXT, ...extra }); }
function B(text) { return R(text, { bold: true }); }

function bullet(runs) {
  const children = typeof runs === 'string' ? [R(runs)] : runs;
  return new Paragraph({ numbering: { reference: 'bul', level: 0 }, children, spacing: { before: 0, after: 60 } });
}
function numbered(runs) {
  const children = typeof runs === 'string' ? [R(runs)] : runs;
  return new Paragraph({ numbering: { reference: 'num', level: 0 }, children, spacing: { before: 0, after: 60 } });
}

// ── Info box ──────────────────────────────────────────────────────────────────
function infoBox(label, text) {
  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [9026],
    rows: [new TableRow({ children: [new TableCell({
      borders: { top: bSingle(SKY), bottom: bSingle(SKY), left: { style: BorderStyle.SINGLE, size: 18, color: SKY }, right: bNone() },
      shading: { fill: 'EFF8FF', type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 200, right: 140 },
      children: [
        new Paragraph({ children: [R(label, { bold: true, color: SKY, size: 18 })], spacing: { before: 0, after: 40 } }),
        new Paragraph({ children: [R(text, { size: 19 })], spacing: { before: 0, after: 0 } }),
      ],
    })]})],
  });
}

// ── Nav table row ─────────────────────────────────────────────────────────────
function navRow(role, items, shade) {
  return new TableRow({ children: [
    new TableCell({ borders: bAll('DDDDDD'), shading: { fill: shade || NAVY, type: ShadingType.CLEAR }, margins: cellPad, width: { size: 1700, type: WidthType.DXA },
      children: [new Paragraph({ children: [R(role, { bold: true, color: WHITE, size: 19 })] })] }),
    new TableCell({ borders: bAll('DDDDDD'), shading: { fill: GRAY, type: ShadingType.CLEAR }, margins: cellPad, width: { size: 7326, type: WidthType.DXA },
      children: [new Paragraph({ children: [R(items, { size: 19 })] })] }),
  ]});
}

// ── Status row ────────────────────────────────────────────────────────────────
function statusRow(state, fill, who, desc) {
  return new TableRow({ children: [
    new TableCell({ borders: bAll('CCCCCC'), shading: { fill, type: ShadingType.CLEAR }, margins: cellPad, width: { size: 1700, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [R(state, { bold: true, color: WHITE, size: 18 })] })] }),
    new TableCell({ borders: bAll('CCCCCC'), shading: { fill: WHITE, type: ShadingType.CLEAR }, margins: cellPad, width: { size: 2400, type: WidthType.DXA },
      children: [new Paragraph({ children: [R(who, { size: 18 })] })] }),
    new TableCell({ borders: bAll('CCCCCC'), shading: { fill: WHITE, type: ShadingType.CLEAR }, margins: cellPad, width: { size: 4926, type: WidthType.DXA },
      children: [new Paragraph({ children: [R(desc, { size: 18 })] })] }),
  ]});
}

// ── Permission table ──────────────────────────────────────────────────────────
function permCell(val) {
  const map = { check: ['✓', GREEN], cross: ['✗', RED], dash: ['—', DASH] };
  const [sym, color] = map[val] || ['—', DASH];
  return new TableCell({ borders: bAll('CCCCCC'), shading: { fill: WHITE, type: ShadingType.CLEAR }, margins: cellPad, verticalAlign: VerticalAlign.CENTER,
    width: { size: 1300, type: WidthType.DXA },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [R(sym, { bold: true, color, size: 20 })] })] });
}
function permHdr(text) {
  return new TableCell({ borders: bAll('999999'), shading: { fill: NAVY, type: ShadingType.CLEAR }, margins: cellPad, verticalAlign: VerticalAlign.CENTER,
    width: { size: 1300, type: WidthType.DXA },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [R(text, { bold: true, color: WHITE, size: 18 })] })] });
}

const PERM_ROWS = [
  ['Ver propias cotizaciones',   'check','check','check','dash', 'dash' ],
  ['Ver todas las cotizaciones', 'dash', 'dash', 'dash', 'check','check'],
  ['Ver propios proyectos',      'check','check','check','dash', 'dash' ],
  ['Ver todos los proyectos',    'dash', 'dash', 'dash', 'check','check'],
  ['Acceder a Clientes',         'check','cross','cross','check','check'],
  ['Eliminar clientes',          'cross','cross','cross','cross','check'],
  ['Acceder a Plantillas',       'check','cross','cross','check','check'],
  ['Crear/editar Plantillas',    'cross','cross','cross','cross','check'],
  ['Enviar cotizacion',          'check','check','check','cross','check'],
  ['Confirmar cotizacion',       'cross','cross','cross','check','check'],
  ['Cancelar cotizacion',        'check','check','check','check','check'],
  ['Precio manual en lineas',    'cross','cross','cross','check','check'],
  ['Solicitar descuento',        'check','check','check','check','dash' ],
  ['Aprobar descuento',          'cross','cross','cross','cross','check'],
  ['Venta de Mostrador',         'cross','check','check','check','check'],
  ['Eliminar proyectos',         'cross','cross','cross','check','check'],
  ['Gestionar usuarios',         'cross','cross','cross','cross','check'],
  ['Gestionar productos',        'cross','cross','cross','cross','check'],
];

function faq(q, a) {
  return [
    new Paragraph({ children: [R(q, { bold: true, color: NAVY })], spacing: { before: 180, after: 60 } }),
    new Paragraph({ children: [R(a, { size: 20 })], spacing: { before: 0, after: 100 } }),
  ];
}

// ══════════════════════════════════════════════════════════════════════════════
// BUILD CONTENT
// ══════════════════════════════════════════════════════════════════════════════
const children = [

  // ─── PORTADA ────────────────────────────────────────────────────────────────
  spacer(60),
  new Table({
    width: { size: 9026, type: WidthType.DXA }, columnWidths: [9026],
    rows: [new TableRow({ children: [new TableCell({
      borders: bNoneAll(), shading: { fill: NAVY, type: ShadingType.CLEAR },
      margins: { top: 900, bottom: 900, left: 600, right: 600 },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [R('LUMI QUOTES', { size: 60, bold: true, color: WHITE })], spacing: { before: 0, after: 160 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [R('Manual de Usuario', { size: 32, color: 'BFD9F2' })], spacing: { before: 0, after: 0 } }),
      ],
    })]})],
  }),
  spacer(120),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [R('Sistema de Cotizacion y Gestion de Proyectos', { size: 22, color: DASH, italics: true })], spacing: { before: 0, after: 0 } }),
  spacer(60),
  new Table({
    width: { size: 9026, type: WidthType.DXA }, columnWidths: [4513, 4513],
    rows: [new TableRow({ children: [
      new TableCell({ borders: bNoneAll(), margins: cellPad, children: [new Paragraph({ children: [R('Smart Systems', { size: 22, bold: true, color: NAVY })] })] }),
      new TableCell({ borders: bNoneAll(), margins: cellPad, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [R('Abril 2026', { size: 22, color: DASH })] })] }),
    ]})],
  }),
  pageBreak(),

  // ─── TABLA DE CONTENIDOS ────────────────────────────────────────────────────
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [R('Contenido', { size: 28, bold: true, color: NAVY })], spacing: { before: 0, after: 200 } }),
  new TableOfContents('Contenido', { hyperlink: true, headingStyleRange: '1-2' }),
  pageBreak(),

  // ─── 1. INTRODUCCION ────────────────────────────────────────────────────────
  h1('1. Introduccion'),
  p('LUMI QUOTES es el sistema de cotizacion y gestion de proyectos de Smart Systems. Permite crear cotizaciones profesionales, organizarlas por proyecto, gestionar clientes y generar documentos PDF listos para entregar al cliente.'),
  spacer(80),
  h2('Roles de usuario'),
  p('El sistema tiene 5 roles, cada uno con distintos niveles de acceso:'),
  spacer(40),
  bullet([B('Ventas: '), R('Crea y gestiona sus propias cotizaciones y proyectos.')]),
  bullet([B('Gerente: '), R('Supervisa todas las cotizaciones del equipo y puede confirmar cotizaciones.')]),
  bullet([B('Administrador: '), R('Acceso total: usuarios, productos, configuracion y todas las cotizaciones.')]),
  bullet([B('Almacen: '), R('Acceso similar a Ventas, sin acceso a Clientes ni Plantillas.')]),
  bullet([B('Soporte: '), R('Acceso similar a Ventas, sin acceso a Clientes ni Plantillas.')]),
  spacer(80),

  // ─── 2. ACCESO ──────────────────────────────────────────────────────────────
  h1('2. Acceso al Sistema'),
  bullet([B('URL: '), R('http://localhost:3000', { color: SKY })]),
  bullet('Ingresar el usuario y contrasena proporcionados por el Administrador.'),
  bullet('La sesion expira automaticamente despues de 8 horas de inactividad.'),
  spacer(80),

  // ─── 3. NAVEGACION ──────────────────────────────────────────────────────────
  h1('3. Navegacion Principal'),
  p('Cada rol tiene acceso a diferentes secciones del sistema:'),
  spacer(60),
  new Table({
    width: { size: 9026, type: WidthType.DXA }, columnWidths: [1700, 7326],
    rows: [
      new TableRow({ children: [
        new TableCell({ borders: bAll('AAAAAA'), shading: { fill: SKY, type: ShadingType.CLEAR }, margins: cellPad, width: { size: 1700, type: WidthType.DXA },
          children: [new Paragraph({ children: [R('Rol', { bold: true, color: WHITE, size: 19 })] })] }),
        new TableCell({ borders: bAll('AAAAAA'), shading: { fill: SKY, type: ShadingType.CLEAR }, margins: cellPad, width: { size: 7326, type: WidthType.DXA },
          children: [new Paragraph({ children: [R('Secciones disponibles', { bold: true, color: WHITE, size: 19 })] })] }),
      ]}),
      navRow('Ventas',          'Inicio | Proyectos | Mis Cotizaciones | Catalogo | Clientes | Plantillas'),
      navRow('Gerente',         'Inicio | Proyectos | Cotizaciones | Clientes | Plantillas | Catalogo'),
      navRow('Administrador',   'Inicio | Proyectos | Cotizaciones | Usuarios | Productos | Descuentos | Plantillas | Clientes | Catalogo | Configuracion'),
      navRow('Almacen/Soporte', 'Inicio | Proyectos | Mis Cotizaciones | Catalogo'),
    ],
  }),
  spacer(80),
  pageBreak(),

  // ─── 4. PROYECTOS ───────────────────────────────────────────────────────────
  h1('4. Proyectos'),
  h2('¿Que es un proyecto?'),
  p('Un proyecto agrupa todas las cotizaciones relacionadas a un cliente y una necesidad especifica. Por ejemplo, "Automatizacion Norteno" puede contener varias cotizaciones con distintas propuestas de precio o alcance.'),
  spacer(60),
  h2('Crear un proyecto'),
  numbered([B('Proyectos '), R('en el menu principal.')]),
  numbered([R('Clic en '), B('+ Nuevo Proyecto.')]),
  numbered('Completar: Nombre, Cliente y Descripcion (opcional).'),
  numbered([R('Clic en '), B('Crear.')]),
  spacer(60),
  h2('Estados de un proyecto'),
  p('Para cambiar el estado, abrir el proyecto y hacer clic en el selector de estado (esquina superior derecha).'),
  spacer(40),
  new Table({
    width: { size: 9026, type: WidthType.DXA }, columnWidths: [2000, 7026],
    rows: [
      new TableRow({ children: [
        new TableCell({ borders: bAll('AAAAAA'), shading: { fill: NAVY, type: ShadingType.CLEAR }, margins: cellPad, width: { size: 2000, type: WidthType.DXA },
          children: [new Paragraph({ children: [R('Estado', { bold: true, color: WHITE, size: 19 })] })] }),
        new TableCell({ borders: bAll('AAAAAA'), shading: { fill: NAVY, type: ShadingType.CLEAR }, margins: cellPad, width: { size: 7026, type: WidthType.DXA },
          children: [new Paragraph({ children: [R('Descripcion', { bold: true, color: WHITE, size: 19 })] })] }),
      ]}),
      ...[
        ['Borrador',    'Proyecto recien creado, en preparacion.'],
        ['Seguimiento', 'En seguimiento activo con el cliente.'],
        ['Demo',        'Se agendo una demostracion.'],
        ['Aprobado',    'El cliente aprobo la propuesta.'],
        ['En Proceso',  'Instalacion o implementacion en curso.'],
        ['Terminado',   'Proyecto finalizado exitosamente.'],
        ['Cancelado',   'Proyecto cancelado.'],
      ].map(([s, d], i) => new TableRow({ children: [
        new TableCell({ borders: bAll('CCCCCC'), shading: { fill: i % 2 === 0 ? LIGHT : WHITE, type: ShadingType.CLEAR }, margins: cellPad, width: { size: 2000, type: WidthType.DXA },
          children: [new Paragraph({ children: [R(s, { bold: true, color: NAVY, size: 19 })] })] }),
        new TableCell({ borders: bAll('CCCCCC'), shading: { fill: i % 2 === 0 ? LIGHT : WHITE, type: ShadingType.CLEAR }, margins: cellPad, width: { size: 7026, type: WidthType.DXA },
          children: [new Paragraph({ children: [R(d, { size: 19 })] })] }),
      ]})),
    ],
  }),
  spacer(60),
  h2('Otras acciones en proyectos'),
  bullet([B('Editar descripcion: '), R('Clic sobre el texto de descripcion del proyecto. Ctrl+Enter para guardar, Esc para cancelar.')]),
  bullet([B('Archivar: '), R('Proyectos inactivos se pueden archivar desde la tabla. Activar filtro "Archivados" para verlos.')]),
  bullet([B('Eliminar (Gerente y Admin): '), R('Clic en el icono x en la tabla. Las cotizaciones relacionadas no se eliminan, solo se desvinculan.')]),
  spacer(80),
  pageBreak(),

  // ─── 5. COTIZACIONES ────────────────────────────────────────────────────────
  h1('5. Cotizaciones'),
  h2('¿Que es una cotizacion?'),
  p('Una cotizacion es una propuesta de venta con productos, cantidades y precios, vinculada a un proyecto y cliente. Tiene un numero unico de folio (ej. COT-20260409-0001).'),
  spacer(60),
  h2('Crear una cotizacion'),
  numbered([R('Abrir el proyecto y clic en '), B('+ Nueva Cotizacion.')]),
  numbered('Completar: Requerimiento, Cliente, Vehiculos (unidades) y Fecha de expiracion.'),
  numbered([R('Clic en '), B('Crear Cotizacion.')]),
  spacer(60),
  h2('Flujo de estados'),
  spacer(40),
  new Table({
    width: { size: 9026, type: WidthType.DXA }, columnWidths: [1700, 2400, 4926],
    rows: [
      new TableRow({ children: [
        new TableCell({ borders: bAll('AAAAAA'), shading: { fill: NAVY, type: ShadingType.CLEAR }, margins: cellPad, width: { size: 1700, type: WidthType.DXA },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [R('Estado', { bold: true, color: WHITE, size: 18 })] })] }),
        new TableCell({ borders: bAll('AAAAAA'), shading: { fill: NAVY, type: ShadingType.CLEAR }, margins: cellPad, width: { size: 2400, type: WidthType.DXA },
          children: [new Paragraph({ children: [R('Quien puede cambiar', { bold: true, color: WHITE, size: 18 })] })] }),
        new TableCell({ borders: bAll('AAAAAA'), shading: { fill: NAVY, type: ShadingType.CLEAR }, margins: cellPad, width: { size: 4926, type: WidthType.DXA },
          children: [new Paragraph({ children: [R('Descripcion', { bold: true, color: WHITE, size: 18 })] })] }),
      ]}),
      statusRow('BORRADOR',   '92400E', 'Todos',                      'Recien creada. Las lineas son editables.'),
      statusRow('ENVIADA',    '1D4ED8', 'Ventas / Almacen / Soporte', 'Propuesta enviada al cliente. Solo lectura.'),
      statusRow('CONFIRMADA', '166534', 'Gerente / Admin',            'Cliente aprobo la propuesta.'),
      statusRow('CANCELADA',  'B91C1C', 'Todos',                      'Cotizacion cancelada.'),
      statusRow('EXPIRADA',   '6B7280', 'Solo Admin',                 'Cotizacion vencida (asignada por Admin).'),
    ],
  }),
  spacer(60),
  infoBox('Importante', 'Las lineas de productos solo son editables en estado BORRADOR. En cualquier otro estado son de solo lectura.'),
  spacer(60),
  h2('Agregar productos a una cotizacion'),
  bullet([B('Buscador: '), R('Escribe nombre o SKU para agregar productos del catalogo.')]),
  bullet([B('+ Seccion: '), R('Agrega un separador con titulo para organizar los productos.')]),
  bullet([B('+ Nota: '), R('Agrega texto libre como aclaracion o comentario.')]),
  bullet([B('- Descuento Global: '), R('Aplica un porcentaje de descuento sobre el total.')]),
  bullet([B('Plantillas: '), R('Carga un conjunto de productos predefinidos con un clic.')]),
  spacer(60),
  h2('Precios y descuentos'),
  bullet([B('Precio sugerido: '), R('Calculado automaticamente. Visible para todos los roles.')]),
  bullet([B('Precio manual (Gerente y Admin): '), R('Solo estos roles pueden editar el precio de cada linea.')]),
  bullet([B('Descuento (%): '), R('Ingresar en la columna DESC %. Si requiere aprobacion, se envia solicitud automatica al Administrador.')]),
  spacer(60),
  h2('Duplicar una cotizacion'),
  bullet([B('Mismo proyecto: '), R('Crea la copia en el mismo proyecto.')]),
  bullet([B('Otro proyecto: '), R('Permite seleccionar un proyecto diferente de la lista.')]),
  bullet([B('Sin proyecto (no disponible para Ventas): '), R('Crea como Venta de Mostrador.')]),
  spacer(60),
  h2('Exportar PDF'),
  p('Boton Exportar PDF: genera un PDF completo con todos los detalles, precios y totales del cliente.'),
  spacer(40),
  h2('Levantamiento PDF'),
  p('Genera un PDF SIN precios, solo con descripcion y cantidades. Ideal para visitas en campo.'),
  numbered([R('Clic en '), B('Levantamiento PDF.')]),
  numbered('Agregar "Detalles para la instalacion" (opcional).'),
  numbered([R('Clic en '), B('Generar PDF.'), R(' El PDF se abre en una nueva pestana.')]),
  spacer(80),
  pageBreak(),

  // ─── 6. VENTA DE MOSTRADOR ──────────────────────────────────────────────────
  h1('6. Venta de Mostrador'),
  p('Una Venta de Mostrador es una cotizacion que NO esta vinculada a ningun proyecto. Se usa para ventas rapidas o consultas puntuales.'),
  spacer(60),
  infoBox('Acceso', 'Disponible para: Gerente, Administrador, Almacen y Soporte. El rol Ventas NO tiene acceso a cotizaciones sin proyecto.'),
  spacer(60),
  h2('Crear una Venta de Mostrador'),
  numbered([R('Ir a '), B('Cotizaciones'), R(' en el menu.')]),
  numbered([R('Clic en '), B('Venta de Mostrador.')]),
  numbered('Completar los datos y crear normalmente.'),
  spacer(40),
  p('Las Ventas de Mostrador aparecen con un distintivo amarillo "MOSTRADOR" en la tabla de cotizaciones.'),
  spacer(80),

  // ─── 7. CLIENTES ────────────────────────────────────────────────────────────
  h1('7. Clientes'),
  infoBox('Disponibilidad', 'Los roles Almacen y Soporte no tienen acceso a la seccion Clientes.'),
  spacer(60),
  h2('Ver clientes'),
  p('Ir a Clientes en el menu. Se puede buscar por nombre.'),
  spacer(40),
  h2('Crear un cliente'),
  p('Desde la seccion Clientes o durante la creacion de una cotizacion/proyecto con el boton + Nuevo cliente.'),
  bullet([B('Nombre: '), R('Campo requerido.')]),
  bullet([B('Email y Telefono: '), R('Opcionales.')]),
  spacer(40),
  h2('Editar un cliente'),
  p('Clic sobre el cliente en la tabla para editar sus datos.'),
  spacer(40),
  h2('Eliminar un cliente (solo Administrador)'),
  p('Desde Administracion > Clientes, con confirmacion.'),
  spacer(80),
  pageBreak(),

  // ─── 8. PLANTILLAS ──────────────────────────────────────────────────────────
  h1('8. Plantillas'),
  infoBox('Disponibilidad', 'Vista disponible para Ventas y Gerente. Gestion (crear/editar/eliminar) solo para Administrador. Almacen y Soporte no tienen acceso.'),
  spacer(60),
  h2('¿Que son?'),
  p('Conjuntos predefinidos de productos y cantidades que se pueden cargar rapidamente en cualquier cotizacion.'),
  spacer(40),
  h2('Usar una plantilla en una cotizacion'),
  numbered([R('En la cotizacion (estado Borrador), clic en '), B('Plantillas.')]),
  numbered('Seleccionar la plantilla deseada.'),
  numbered('Los productos se agregan automaticamente a la cotizacion.'),
  spacer(40),
  h2('Gestionar plantillas (solo Administrador)'),
  p('Desde Administracion > Plantillas:'),
  bullet('Crear nueva plantilla con nombre, descripcion y lista de productos.'),
  bullet('Editar plantillas existentes.'),
  bullet('Eliminar plantillas.'),
  spacer(80),

  // ─── 9. DESCUENTOS ──────────────────────────────────────────────────────────
  h1('9. Descuentos y Aprobaciones'),
  h2('Solicitar un descuento'),
  numbered('En la cotizacion (Borrador), ingresar el porcentaje en la columna DESC %.'),
  numbered('Si el descuento supera el limite autorizado, aparece el boton Solicitar aprobacion.'),
  numbered('La solicitud llega al Administrador automaticamente.'),
  spacer(60),
  h2('Aprobar descuentos (solo Administrador)'),
  numbered([R('Ir a '), B('Administracion > Descuentos.')]),
  numbered('Ver lista de solicitudes pendientes (cotizacion, vendedor y porcentaje).'),
  numbered('Clic en el icono de aprobacion o rechazo.'),
  numbered('El vendedor recibe la respuesta en tiempo real.'),
  spacer(80),
  pageBreak(),

  // ─── 10. ADMINISTRACION ─────────────────────────────────────────────────────
  h1('10. Administracion (solo Administrador)'),
  h2('Usuarios'),
  p('Desde Administracion > Usuarios:'),
  bullet('Ver todos los usuarios del sistema con su rol.'),
  bullet('Crear nuevos usuarios: nombre de usuario, contrasena y rol.'),
  bullet('Editar usuario: cambiar nombre, rol o contrasena.'),
  bullet('Eliminar usuarios (con confirmacion).'),
  spacer(60),
  h2('Productos / Catalogo'),
  p('Desde Administracion > Productos:'),
  bullet('Ver catalogo completo en vista lista o grid.'),
  bullet('Buscar por nombre o SKU. Filtrar por moneda (MXN/USD) o categoria.'),
  bullet('Crear producto: SKU, nombre, descripcion, costo, utilidad y factor de utilidad.'),
  bullet('Editar y eliminar productos.'),
  spacer(60),
  h2('Configuracion'),
  p('Tipo de cambio USD/MXN e impuestos aplicables a las cotizaciones del sistema.'),
  spacer(80),
  pageBreak(),

  // ─── 11. TABLA DE PERMISOS ──────────────────────────────────────────────────
  h1('11. Tabla de Permisos por Rol'),
  spacer(40),
  new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [2526, 1300, 1300, 1300, 1300, 1300],
    rows: [
      new TableRow({ children: [
        new TableCell({ borders: bAll('999999'), shading: { fill: NAVY, type: ShadingType.CLEAR }, margins: cellPad, verticalAlign: VerticalAlign.CENTER, width: { size: 2526, type: WidthType.DXA },
          children: [new Paragraph({ children: [R('Accion', { bold: true, color: WHITE, size: 18 })] })] }),
        permHdr('Ventas'), permHdr('Almacen'), permHdr('Soporte'), permHdr('Gerente'), permHdr('Admin'),
      ]}),
      ...PERM_ROWS.map(([action, ...vals], i) => new TableRow({ children: [
        new TableCell({ borders: bAll('CCCCCC'), shading: { fill: i % 2 === 0 ? LIGHT : WHITE, type: ShadingType.CLEAR }, margins: cellPad, width: { size: 2526, type: WidthType.DXA },
          children: [new Paragraph({ children: [R(action, { size: 18 })] })] }),
        ...vals.map(v => permCell(v)),
      ]})),
    ],
  }),
  spacer(60),
  pMixed([
    R('  ✓  ', { bold: true, color: GREEN, size: 19 }), R('Permitido     ', { size: 18 }),
    R('  ✗  ', { bold: true, color: RED, size: 19 }), R('No permitido     ', { size: 18 }),
    R('  —  ', { bold: true, color: DASH, size: 19 }), R('No aplica', { size: 18 }),
  ], 0),
  spacer(80),
  pageBreak(),

  // ─── 12. FAQ ────────────────────────────────────────────────────────────────
  h1('12. Preguntas Frecuentes'),
  spacer(40),
  ...faq('¿Por que no puedo editar las lineas de una cotizacion?',
         'Las cotizaciones solo son editables en estado BORRADOR. Si ya fue enviada, confirmada o cancelada, las lineas son de solo lectura. Solo el Administrador puede regresar la cotizacion a Borrador.'),
  ...faq('¿Por que no veo el boton "Venta de Mostrador"?',
         'Esta funcion no esta disponible para el rol Ventas. Solo pueden acceder Gerente, Administrador, Almacen y Soporte.'),
  ...faq('¿Que diferencia hay entre Exportar PDF y Levantamiento PDF?',
         'Exportar PDF incluye precios, totales y todos los detalles comerciales. Levantamiento PDF muestra solo descripcion y cantidades sin precios, ideal para visitas en campo.'),
  ...faq('¿Como puedo ver cotizaciones de otros vendedores?',
         'Solo los roles Gerente y Administrador pueden ver todas las cotizaciones del equipo. Los demas roles ven unicamente las propias.'),
  ...faq('Mi descuento no se aplica directamente, ¿que hago?',
         'Si el descuento supera el limite autorizado, debes solicitar aprobacion desde la cotizacion. El Administrador recibira la notificacion y la aprobara o rechazara.'),
  ...faq('¿Puedo recuperar una cotizacion cancelada?',
         'Solo el Administrador puede cambiar el estado de una cotizacion cancelada a cualquier otro estado.'),
  ...faq('¿Que pasa si archivo un proyecto?',
         'El proyecto se oculta de la lista principal pero no se elimina. Puedes verlo activando el filtro "Archivados". Las cotizaciones del proyecto permanecen intactas.'),
];

// ══════════════════════════════════════════════════════════════════════════════
// ASSEMBLE DOCUMENT
// ══════════════════════════════════════════════════════════════════════════════
const doc = new Document({
  numbering: {
    config: [
      { reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 560, hanging: 280 } } } }] },
      { reference: 'num', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 560, hanging: 280 } } } }] },
    ],
  },
  styles: {
    default: { document: { run: { font: 'Arial', size: 21, color: TEXT } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'Arial', color: NAVY },
        paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 22, bold: true, font: 'Arial', color: NAVY },
        paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 1 } },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
      },
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'LUMI QUOTES  |  Smart Systems  |  Pagina ', font: 'Arial', size: 16, color: DASH }),
          new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 16, color: DASH }),
        ],
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD', space: 4 } },
      })] }),
    },
    children,
  }],
});

const OUT = 'C:/Users/MARKETING & DISEÑO/Documents/cotizador-app/docs/Manual_de_Usuario_LUMI.docx';
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUT, buf);
  console.log('OK: Manual generado en', OUT);
}).catch(e => { console.error('ERROR:', e.message); process.exit(1); });
