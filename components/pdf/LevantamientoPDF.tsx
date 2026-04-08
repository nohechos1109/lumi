import { Document, Page, Text, View, StyleSheet, Image, Svg, Path } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: '120 40 85 40', fontFamily: 'Helvetica', fontSize: 9, color: '#262626' },

  headerContainer: { position: 'absolute', top: 0, left: 0, right: 0, height: 110 },
  footerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 75 },

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

  colDesc: { width: '80%' },
  colQty: { width: '20%', textAlign: 'right' },

  detallesBox: {
    marginTop: 25,
    border: '1.5 solid #1B3461',
    borderRadius: 4,
    padding: 12,
    minHeight: 100,
  },
  detallesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1B3461',
    marginBottom: 8,
    borderBottom: '1 solid #D1E1EF',
    paddingBottom: 4,
    letterSpacing: 0.5,
  },
  detallesContent: {
    fontSize: 8.5,
    color: '#374151',
    lineHeight: 1.6,
  },

  footerText: { fontSize: 7, color: '#9CA3AF', textAlign: 'center' },
})

interface Line {
  id: string
  name: string
  sku?: string
  qty: string | null
  unit_price_mxn_effective: string
  subtotal: string
  display_type: string
  discount_percent: string
}

interface Quote {
  number: string
  quotation_date: string
  expiration_date: string | null
  customer_name?: string
  executive_name?: string
  amount_untaxed: string
  amount_tax: string
  amount_total: string
  terms: string | null
  description: string | null
  unit_count: number
  state: string
}

export default function LevantamientoPDF({
  quote,
  lines,
  images,
  detalles,
}: {
  quote: Quote
  lines: Line[]
  images: { logo: string }
  detalles: string
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* SVG Header Background + Logo */}
        <View style={styles.headerContainer} fixed>
          <Svg viewBox="0 0 595 110">
            <Path d="M 0 0 L 595 0 L 595 60 C 450 100 150 40 0 90 Z" fill="#1B3461" />
            <Path d="M 0 90 C 150 40 450 100 595 60 L 595 65 C 450 105 150 45 0 95 Z" fill="#0EA5E9" />
          </Svg>
          <Image src={images.logo} style={{ position: 'absolute', bottom: 8, left: 40, width: 140 }} />
        </View>

        {/* Top Info */}
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

        {/* Items Table — DESCRIPCIÓN + CANTIDAD only */}
        <View style={styles.table}>
          <View style={styles.tableHeader} fixed>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>DESCRIPCIÓN</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>CANT.</Text>
          </View>

          {lines.map((line) => {
            if (line.display_type === 'section') {
              return (
                <View key={line.id} style={[styles.tableRow, styles.sectionRow]} wrap={false}>
                  <Text style={{ width: '100%', color: '#1B3461', fontWeight: 'bold', fontSize: 9 }}>
                    {line.name.toUpperCase()}
                  </Text>
                </View>
              )
            }
            if (line.display_type === 'note') {
              return (
                <View key={line.id} style={styles.tableRow} wrap={false}>
                  <Text style={{ width: '100%', color: '#6B7280', fontStyle: 'italic', fontSize: 7.5 }}>
                    • {line.name}
                  </Text>
                </View>
              )
            }
            // Omit discount lines in levantamiento
            if (line.display_type === 'discount') {
              return null
            }

            return (
              <View key={line.id} style={styles.tableRow} wrap={false}>
                <View style={styles.colDesc}>
                  <Text style={styles.itemText}>{line.name}</Text>
                </View>
                <Text style={[styles.itemText, styles.colQty]}>{Math.floor(Number(line.qty))}</Text>
              </View>
            )
          })}
        </View>

        {/* Detalles para la Instalación */}
        <View style={styles.detallesBox}>
          <Text style={styles.detallesTitle}>DETALLES PARA LA INSTALACIÓN</Text>
          <Text style={styles.detallesContent}>{detalles || ''}</Text>
        </View>

        {/* SVG Footer */}
        <View style={styles.footerContainer} fixed>
          <Text
            style={{
              fontSize: 13,
              fontWeight: 'bold',
              color: '#1B3461',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              textAlign: 'center',
            }}
          >
            www.smart-systems.com.mx
          </Text>
          <Svg viewBox="0 0 595 50" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 50 }}>
            <Path d="M 0 50 L 595 50 L 595 10 C 450 40 150 0 0 30 Z" fill="#1B3461" />
            <Path d="M 0 30 C 150 0 450 40 595 10 L 595 5 C 450 35 150 -5 0 25 Z" fill="#0EA5E9" />
          </Svg>
          <View style={{ position: 'absolute', bottom: 10, left: 0, right: 0 }}>
            <Text style={{ fontSize: 7, color: 'white', textAlign: 'center' }}>
              Domicilio: Central 31, Ciudad Aztlán, Tonalá, Jalisco. Teléfono (33) 1316-6715.
            </Text>
          </View>
        </View>

      </Page>
    </Document>
  )
}
