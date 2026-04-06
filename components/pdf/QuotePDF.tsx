import { Document, Page, Text, View, StyleSheet, Image, Svg, Path, Rect, Circle } from '@react-pdf/renderer'


const styles = StyleSheet.create({
  page: { padding: '40 40 60 40', fontFamily: 'Helvetica', fontSize: 9, color: '#262626' },
  
  // Header Branding (SVG)
  headerContainer: { position: 'absolute', top: 0, left: 0, right: 0, height: 110 },
  
  // Footer Branding (SVG)
  footerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 50 },

  // Content Layout
  logo: { width: 140, marginBottom: 20 },
  topInfo: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 30 },
  
  column: { width: '48%' },
  sectionTitle: { fontSize: 10, fontWeight: 'bold', color: '#1B3461', marginBottom: 10, borderBottom: '1 solid #E5E7EB', paddingBottom: 4 },
  label: { fontSize: 8, color: '#6B7280', marginBottom: 2 },
  value: { fontSize: 9, marginBottom: 6 },
  highlightValue: { fontSize: 11, fontWeight: 'bold', color: '#1B3461' },

  table: { marginTop: 10 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1B3461', padding: '6 8', borderRadius: 2 },
  tableHeaderText: { color: 'white', fontSize: 8, fontWeight: 'bold' },
  
  tableRow: { flexDirection: 'row', padding: '6 8', borderBottom: '1 solid #F3F4F6', alignItems: 'center' },
  sectionRow: { backgroundColor: '#F9FAFB', borderBottom: '1 solid #E5E7EB' },
  itemText: { fontSize: 8.5 },
  skuText: { fontSize: 7, color: '#9CA3AF', marginTop: 1 },

  colDesc: { width: '50%' },
  colQty: { width: '10%', textAlign: 'right' },
  colPrice: { width: '15%', textAlign: 'right' },
  colDisc: { width: '10%', textAlign: 'right' },
  colTotal: { width: '15%', textAlign: 'right' },

  totalsArea: { marginTop: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  notesBox: { width: '55%', paddingTop: 5 },
  noteItem: { flexDirection: 'row', marginBottom: 4 },
  noteBullet: { width: 8, fontSize: 10, color: '#1B3461' },
  noteText: { flex: 1, fontSize: 7, color: '#4B5563', lineHeight: 1.3 },
  
  warrantyBadgeContainer: { marginTop: 15, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9FF', padding: 8, borderRadius: 6, border: '1 dashed #0EA5E9', width: 160 },
  warrantyText: { marginLeft: 8, fontSize: 8, fontWeight: 'bold', color: '#1B3461' },
  
  totalsBox: { width: 220, backgroundColor: '#F3F7FA', padding: 10, borderRadius: 4, border: '1 solid #D1E1EF' },
  totalEntry: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottom: '1 solid #D1E1EF' },
  grandTotal: { flexDirection: 'row', justifyContent: 'space-between', padding: '8 0', marginTop: 5 },
  grandTotalText: { fontSize: 12, fontWeight: 'bold', color: '#1B3461' },

  fleetHighlight: { marginTop: 10, backgroundColor: 'white', padding: 8, borderRadius: 4, border: '1 solid #D1E1EF' },
  terms: { marginTop: 30, paddingTop: 10, borderTop: '1 solid #E5E7EB' },
  
  contactSection: { marginTop: 20, alignItems: 'center' },
  website: { fontSize: 13, color: '#1B3461', fontWeight: 'bold', marginBottom: 4 },
  address: { fontSize: 8, color: '#4B5563' },
  
  footerText: { fontSize: 7, color: '#9CA3AF', textAlign: 'center', marginTop: 10 }
})

interface Line { 
  id: string; 
  name: string; 
  sku?: string;
  qty: string | null; 
  unit_price_mxn_effective: string; 
  subtotal: string; 
  display_type: string; 
  discount_percent: string 
}

interface Quote { 
  number: string; 
  quotation_date: string; 
  expiration_date: string | null; 
  customer_name?: string; 
  executive_name?: string;
  amount_untaxed: string; 
  amount_tax: string; 
  amount_total: string; 
  terms: string | null; 
  description: string | null; 
  unit_count: number; 
  state: string;
}

export default function QuotePDF({ quote, lines, images }: { quote: Quote; lines: Line[]; images: { logo: string } }) {
  const isFleet = quote.unit_count > 1

  const watermarkText = quote.state === 'draft' ? 'VISTA PREVIA' : quote.state === 'cancelled' ? 'CANCELADA' : null

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Watermark Layer */}
        {watermarkText && (
          <View 
            style={{ 
              position: 'absolute', 
              top: 0, left: 0, right: 0, bottom: 0, 
              justifyContent: 'center', alignItems: 'center',
              zIndex: -1,
            }}
            fixed
          >
            <Text 
              style={{ 
                fontSize: 80, 
                fontWeight: 'bold', 
                color: '#FF0000', 
                opacity: 0.15,
                transform: 'rotate(-45deg)',
                letterSpacing: 8
              }}
            >
              {watermarkText}
            </Text>
          </View>
        )}
        
        {/* SVG Header Background */}
        <View style={styles.headerContainer} fixed>
          <Svg viewBox="0 0 595 110">
            {/* Dark Navy Swoosh */}
            <Path d="M 0 0 L 595 0 L 595 60 C 450 100 150 40 0 90 Z" fill="#1B3461" />
            {/* Sky Blue Accent Line */}
            <Path d="M 0 90 C 150 40 450 100 595 60 L 595 65 C 450 105 150 45 0 95 Z" fill="#0EA5E9" />
          </Svg>
        </View>

        {/* Logo and Main Info */}
        <View style={{ marginTop: 20 }}>
          <Image src={images.logo} style={styles.logo} />
        </View>

        <View style={styles.topInfo}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>INFORMACIÓN DEL PROYECTO</Text>
            <Text style={styles.label}>CLIENTE</Text>
            <Text style={styles.highlightValue}>{quote.customer_name?.toUpperCase()}</Text>
            <Text style={[styles.label, { marginTop: 8 }]}>FOLIO</Text>
            <Text style={styles.value}>{quote.number}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>DETALLES COMERCIALES</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text style={styles.label}>FECHA EMISIÓN</Text>
                <Text style={styles.value}>{new Date(quote.quotation_date).toLocaleDateString('es-MX')}</Text>
              </View>
              <View>
                <Text style={styles.label}>VALIDEZ</Text>
                <Text style={styles.value}>
                  {quote.expiration_date ? new Date(quote.expiration_date).toLocaleDateString('es-MX') : '30 días'}
                </Text>
              </View>
            </View>
            <Text style={[styles.label, { marginTop: 2 }]}>EJECUTIVO DE VENTAS</Text>
            <Text style={styles.value}>{quote.executive_name?.toUpperCase() || 'EQUIPO LUMI'}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader} fixed>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>DESCRIPCIÓN</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>CANT.</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>PRECIO UNIT.</Text>
            <Text style={[styles.tableHeaderText, styles.colDisc]}>DESC.</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>SUBTOTAL</Text>
          </View>

          {lines.map((line) => {
            if (line.display_type === 'section') {
              return (
                <View key={line.id} style={[styles.tableRow, styles.sectionRow]}>
                  <Text style={{ width: '100%', color: '#1B3461', fontWeight: 'bold', fontSize: 9 }}>{line.name.toUpperCase()}</Text>
                </View>
              )
            }
            if (line.display_type === 'note') {
              return (
                <View key={line.id} style={styles.tableRow}>
                  <Text style={{ width: '100%', color: '#6B7280', fontStyle: 'italic', fontSize: 7.5 }}>• {line.name}</Text>
                </View>
              )
            }
            if (line.display_type === 'discount') {
              return (
                <View key={line.id} style={styles.tableRow}>
                  <Text style={[styles.colDesc, { color: '#0EA5E9', fontWeight: 'bold' }]}>DESCUENTO GLOBAL ({line.discount_percent}%)</Text>
                  <Text style={styles.colQty}></Text>
                  <Text style={styles.colPrice}></Text>
                  <Text style={styles.colDisc}></Text>
                  <Text style={[styles.colTotal, { color: '#0EA5E9', fontWeight: 'bold' }]}>
                    -${Math.abs(Number(line.subtotal)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              )
            }

            return (
              <View key={line.id} style={styles.tableRow}>
                <View style={styles.colDesc}>
                  <Text style={styles.itemText}>{line.name}</Text>
                </View>
                <Text style={[styles.itemText, styles.colQty]}>{Math.floor(Number(line.qty))}</Text>
                <Text style={[styles.itemText, styles.colPrice]}>${Number(line.unit_price_mxn_effective).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Text>
                <Text style={[styles.itemText, styles.colDisc]}>{Number(line.discount_percent) > 0 ? `${line.discount_percent}%` : '-'}</Text>
                <Text style={[styles.itemText, styles.colTotal]}>${Number(line.subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Text>
              </View>
            )
          })}
        </View>

        {/* Notes and Totals Section */}
        <View style={styles.totalsArea}>
          <View style={styles.notesBox}>
            <View style={styles.noteItem}>
              <Text style={styles.noteBullet}>•</Text>
              <Text style={styles.noteText}>
                El acceso a las <Text style={{ fontWeight: 'bold' }}>cámaras</Text> requiere un plan de datos con su proveedor de su preferencia (AT&T, Telcel, Movistar, Unefón, Smart).
              </Text>
            </View>
            <View style={styles.noteItem}>
              <Text style={styles.noteBullet}>•</Text>
              <Text style={styles.noteText}>
                Las medidas de los cables pueden variar según la carrocería y el modelo de cada unidad.
              </Text>
            </View>
            <View style={styles.noteItem}>
              <Text style={styles.noteBullet}>•</Text>
              <Text style={styles.noteText}>
                Precios Sujetos a Cambio y Exhibidos en Moneda Nacional (Pesos)
              </Text>
            </View>

            {/* Warranty Badge */}
            <View style={styles.warrantyBadgeContainer}>
              <Svg viewBox="0 0 100 100" style={{ width: 35, height: 35 }}>
                <Path 
                  d="M50 2 L54.5 12.5 L65.5 10 L66.5 21.5 L77.5 22.5 L75 33.5 L84 41 L78 51 L84 61 L75 68.5 L77.5 79.5 L66.5 80.5 L65.5 92 L54.5 89.5 L50 100 L45.5 89.5 L34.5 92 L33.5 80.5 L22.5 79.5 L25 68.5 L16 61 L22 51 L16 41 L25 33.5 L22.5 22.5 L33.5 21.5 L34.5 10 L45.5 12.5 Z" 
                  fill="#1B3461" 
                />
                <Circle cx="50" cy="50" r="38" fill="#0EA5E9" />
                <Path 
                  d="M32 52 L45 65 L68 40" 
                  stroke="white" 
                  strokeWidth="8" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  fill="none" 
                />
              </Svg>
              <View>
                <Text style={[styles.warrantyText, { fontSize: 9 }]}>SATISFACCIÓN</Text>
                <Text style={[styles.warrantyText, { fontSize: 9 }]}>GARANTIZADA</Text>
              </View>
            </View>
          </View>

          <View style={styles.totalsBox}>
            <View style={styles.totalEntry}>
              <Text style={styles.label}>Subtotal:</Text>
              <Text style={styles.value}>${Number(quote.amount_untaxed).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</Text>
            </View>
            <View style={styles.totalEntry}>
              <Text style={styles.label}>Iva:</Text>
              <Text style={styles.value}>${Number(quote.amount_tax).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</Text>
            </View>
            <View style={styles.grandTotal}>
              <Text style={[styles.grandTotalText, { fontSize: 10 }]}>Total:</Text>
              <Text style={styles.grandTotalText}>${Number(quote.amount_total).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</Text>
            </View>

            {isFleet && (
              <View style={styles.fleetHighlight}>
                <Text style={{ fontSize: 7, color: '#1B3461', fontWeight: 'bold', marginBottom: 4 }}>RESUMEN DE FLOTA ({quote.unit_count} UNIDADES)</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#1B3461' }}>TOTAL FLOTA</Text>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1B3461' }}>
                    ${(Number(quote.amount_total) * quote.unit_count).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Contact info below totals */}
        <View style={styles.contactSection}>
          <Text style={styles.website}>www.smart-systems.com.mx</Text>
        </View>

        {/* Terms and Conditions */}
        {quote.terms && (
          <View style={styles.terms}>
            <Text style={[styles.label, { color: '#1B3461', fontWeight: 'bold' }]}>TÉRMINOS Y CONDICIONES</Text>
            <Text style={{ fontSize: 7.5, color: '#4B5563', marginTop: 4, lineHeight: 1.4 }}>{quote.terms}</Text>
          </View>
        )}

        {/* SVG Footer Background */}
        <View style={styles.footerContainer} fixed>
          <Svg viewBox="0 0 595 50">
            <Path d="M 0 50 L 595 50 L 595 10 C 450 40 150 0 0 30 Z" fill="#1B3461" />
            <Path d="M 0 30 C 150 0 450 40 595 10 L 595 5 C 450 35 150 -5 0 25 Z" fill="#0EA5E9" />
          </Svg>
          <View style={{ position: 'absolute', bottom: 10, left: 0, right: 0 }}>
             <Text style={[styles.footerText, { color: 'white' }]}>Domicilio: Central 31, Ciudad Aztlán, Tonalá, Jalisco. Teléfono (33) 1316-6715.</Text>
          </View>
        </View>
        
      </Page>
    </Document>
  )
}
