import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1d4ed8' },
  subtitle: { fontSize: 9, color: '#6b7280', marginTop: 2 },
  section: { marginBottom: 16 },
  label: { fontSize: 8, color: '#6b7280', textTransform: 'uppercase', marginBottom: 2 },
  value: { fontSize: 10 },
  table: { marginTop: 16 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', padding: '6 8', marginBottom: 1 },
  tableRow: { flexDirection: 'row', padding: '5 8', borderBottom: '1 solid #f3f4f6' },
  col1: { flex: 3 },
  col2: { flex: 1, textAlign: 'right' },
  totals: { marginTop: 12, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', gap: 16, marginBottom: 4 },
  totalLabel: { fontSize: 9, color: '#6b7280', width: 80, textAlign: 'right' },
  totalValue: { fontSize: 9, width: 80, textAlign: 'right' },
  grandTotal: { flexDirection: 'row', gap: 16, backgroundColor: '#1d4ed8', padding: '6 8', borderRadius: 4 },
  grandLabel: { fontSize: 10, color: 'white', fontWeight: 'bold', width: 80, textAlign: 'right' },
  grandValue: { fontSize: 10, color: 'white', fontWeight: 'bold', width: 80, textAlign: 'right' },
})

interface Line { id: string; name: string; qty: string | null; unit_price_mxn_effective: string; subtotal: string; display_type: string; discount_percent: string }
interface Quote { number: string; quotation_date: string; expiration_date: string | null; customer_name?: string; amount_untaxed: string; amount_tax: string; amount_total: string; terms: string | null; description: string | null; unit_count: number; }

export default function QuotePDF({ quote, lines }: { quote: Quote; lines: Line[] }) {
  const isFleet = quote.unit_count > 1

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Cotización</Text>
            <Text style={styles.subtitle}>{quote.number}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.label}>Fecha</Text>
            <Text style={styles.value}>{new Date(quote.quotation_date).toLocaleDateString('es-MX')}</Text>
            {quote.expiration_date && (
              <>
                <Text style={[styles.label, { marginTop: 6 }]}>Válida hasta</Text>
                <Text style={styles.value}>{new Date(quote.expiration_date).toLocaleDateString('es-MX')}</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Cliente</Text>
          <Text style={styles.value}>{quote.customer_name}</Text>
        </View>

        {quote.description && (
          <View style={styles.section}>
            <Text style={styles.label}>Descripción</Text>
            <Text style={[styles.value, { color: '#374151' }]}>{quote.description}</Text>
          </View>
        )}

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.col1, { fontWeight: 'bold', fontSize: 8, color: '#6b7280' }]}>DESCRIPCIÓN</Text>
            <Text style={[styles.col2, { fontWeight: 'bold', fontSize: 8, color: '#6b7280' }]}>CANT.</Text>
            <Text style={[styles.col2, { fontWeight: 'bold', fontSize: 8, color: '#6b7280' }]}>PRECIO</Text>
            <Text style={[styles.col2, { fontWeight: 'bold', fontSize: 8, color: '#6b7280' }]}>SUBTOTAL</Text>
          </View>
          {lines.map(line => {
            if (line.display_type === 'section') {
              return (
                <View key={line.id} style={[styles.tableRow, { backgroundColor: '#f9fafb' }]}>
                  <Text style={{ flex: 4, fontWeight: 'bold', fontSize: 9, color: '#374151' }}>{line.name}</Text>
                </View>
              )
            }
            if (line.display_type === 'note') {
              return (
                <View key={line.id} style={styles.tableRow}>
                  <Text style={{ flex: 4, color: '#6b7280', fontStyle: 'italic' }}>{line.name}</Text>
                </View>
              )
            }
            if (line.display_type === 'discount') {
              return (
                <View key={line.id} style={styles.tableRow}>
                  <Text style={[styles.col1, { color: '#d97706', fontWeight: 'bold' }]}>{line.name} ({line.discount_percent}%)</Text>
                  <Text style={styles.col2}></Text>
                  <Text style={styles.col2}></Text>
                  <Text style={[styles.col2, { color: '#d97706', fontWeight: 'bold' }]}>
                    {Number(line.subtotal) < 0 ? '-' : ''}${Math.abs(Number(line.subtotal)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              )
            }
            return (
              <View key={line.id} style={styles.tableRow}>
                <Text style={styles.col1}>{line.name}</Text>
                <Text style={styles.col2}>{line.qty ?? 1}</Text>
                <Text style={styles.col2}>${Number(line.unit_price_mxn_effective).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Text>
                <Text style={styles.col2}>${Number(line.subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Text>
              </View>
            )
          })}
        </View>

        <View style={styles.totals}>
          {isFleet && <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 4, fontStyle: 'italic' }}>Costos por 1 vehículo ({quote.unit_count} seleccionados):</Text>}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>${Number(quote.amount_untaxed).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>IVA</Text>
            <Text style={styles.totalValue}>${Number(quote.amount_tax).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={[styles.grandTotal, isFleet ? { backgroundColor: '#f3f4f6', color: '#1a1a1a', marginBottom: 16 } : {}]}>
            <Text style={[styles.grandLabel, isFleet ? { color: '#1a1a1a' } : {}]}>Total {isFleet && '(1 ud)'}</Text>
            <Text style={[styles.grandValue, isFleet ? { color: '#1a1a1a' } : {}]}>${Number(quote.amount_total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Text>
          </View>

          {isFleet && (
            <>
              <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 4, fontStyle: 'italic' }}>Costo total por flota conjunta ({quote.unit_count} vehículos):</Text>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal Flota</Text>
                <Text style={styles.totalValue}>${(Number(quote.amount_untaxed) * quote.unit_count).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>IVA Flota</Text>
                <Text style={styles.totalValue}>${(Number(quote.amount_tax) * quote.unit_count).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Text>
              </View>
              <View style={styles.grandTotal}>
                <Text style={styles.grandLabel}>Total Flota</Text>
                <Text style={styles.grandValue}>${(Number(quote.amount_total) * quote.unit_count).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Text>
              </View>
            </>
          )}
        </View>

        {quote.terms && (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.label}>Términos y condiciones</Text>
            <Text style={[styles.value, { color: '#6b7280', marginTop: 4 }]}>{quote.terms}</Text>
          </View>
        )}
      </Page>
    </Document>
  )
}
