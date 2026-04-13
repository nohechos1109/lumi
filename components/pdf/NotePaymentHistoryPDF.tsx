import { Document, Page, Text, View, StyleSheet, Image, Svg, Path } from '@react-pdf/renderer'
import { METHOD_LABELS } from '@/lib/constants/payments'

const styles = StyleSheet.create({
  page: { padding: '120 40 85 40', fontFamily: 'Helvetica', fontSize: 9, color: '#262626' },

  headerContainer: { position: 'absolute', top: 0, left: 0, right: 0, height: 110 },
  footerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 75 },

  topInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  column: { width: '48%' },
  sectionTitle: { fontSize: 10, fontWeight: 'bold', color: '#1B3461', marginBottom: 10, borderBottom: '1 solid #E5E7EB', paddingBottom: 4 },
  label: { fontSize: 8, color: '#6B7280', marginBottom: 2 },
  value: { fontSize: 9, marginBottom: 6 },
  highlightValue: { fontSize: 11, fontWeight: 'bold', color: '#1B3461' },

  // Summary cards
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  summaryCard: { flex: 1, backgroundColor: '#F3F7FA', border: '1 solid #D1E1EF', borderRadius: 4, padding: 10, alignItems: 'center' },
  summaryLabel: { fontSize: 7.5, color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', fontWeight: 'bold' },
  summaryValue: { fontSize: 14, fontWeight: 'bold' },

  // Table
  tableHeader: { flexDirection: 'row', backgroundColor: '#1B3461', padding: '6 8', borderRadius: 2 },
  tableHeaderText: { color: 'white', fontSize: 7.5, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', padding: '7 8', borderBottom: '1 solid #F3F4F6', alignItems: 'center' },
  tableRowAlt: { backgroundColor: '#FAFBFC' },
  cellText: { fontSize: 8.5 },

  colSeq: { width: '6%' },
  colDate: { width: '15%' },
  colMethod: { width: '16%' },
  colRef: { width: '21%' },
  colAmount: { width: '18%', textAlign: 'right' },
  colAccum: { width: '12%', textAlign: 'right' },
  colBalance: { width: '12%', textAlign: 'right' },

  footerText: { fontSize: 7, color: '#9CA3AF', textAlign: 'center', marginTop: 10 },
  website: { fontSize: 13, color: '#1B3461', fontWeight: 'bold', marginBottom: 4 },
})

const fmt = (n: string | number) =>
  Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtDate = (s: string) => {
  const d = new Date(s + (s.length === 10 ? 'T12:00:00' : ''))
  return isNaN(d.getTime()) ? s : d.toLocaleDateString('es-MX')
}

interface NoteData {
  number: string
  concept: string | null
  amount_total: string
  amount_paid: string
  amount_balance: string
  created_at: string
}

interface SaleData {
  number: string
  customer_name?: string
}

interface PaymentItem {
  seq: number
  payment_date: string
  amount: string
  payment_method: string
  reference: string | null
}

interface Props {
  note: NoteData
  sale: SaleData
  payments: PaymentItem[]
  logoPath: string
}

export default function NotePaymentHistoryPDF({ note, sale, payments, logoPath }: Props) {
  const total = Number(note.amount_total)
  const paid = Number(note.amount_paid)
  const balance = Number(note.amount_balance)
  const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* SVG Header */}
        <View style={styles.headerContainer} fixed>
          <Svg viewBox="0 0 595 110">
            <Path d="M 0 0 L 595 0 L 595 60 C 450 100 150 40 0 90 Z" fill="#1B3461" />
            <Path d="M 0 90 C 150 40 450 100 595 60 L 595 65 C 450 105 150 45 0 95 Z" fill="#0EA5E9" />
          </Svg>
          <Image src={logoPath} style={{ position: 'absolute', bottom: 8, left: 40, width: 140 }} />
          <Text style={{ position: 'absolute', top: 20, right: 40, fontSize: 14, fontWeight: 'bold', color: 'white' }}>
            HISTORIAL DE PAGOS
          </Text>
        </View>

        {/* Info block */}
        <View style={styles.topInfo}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>CLIENTE</Text>
            <Text style={styles.highlightValue}>{sale.customer_name?.toUpperCase() ?? '—'}</Text>
            <Text style={[styles.label, { marginTop: 8 }]}>VENTA</Text>
            <Text style={styles.value}>{sale.number}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>NOTA DE COBRO</Text>
            <Text style={[styles.value, { fontWeight: 'bold', fontSize: 11 }]}>{note.number}</Text>
            <Text style={[styles.label, { marginTop: 2 }]}>FECHA</Text>
            <Text style={styles.value}>{fmtDate(note.created_at)}</Text>
            {note.concept && (
              <>
                <Text style={[styles.label, { marginTop: 2 }]}>CONCEPTO</Text>
                <Text style={styles.value}>{note.concept}</Text>
              </>
            )}
          </View>
        </View>

        {/* Summary cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={[styles.summaryValue, { color: '#1B3461' }]}>${fmt(total)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Pagado</Text>
            <Text style={[styles.summaryValue, { color: '#15803D' }]}>${fmt(paid)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Saldo</Text>
            <Text style={[styles.summaryValue, { color: balance <= 0 ? '#15803D' : '#EA580C' }]}>${fmt(balance)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Avance</Text>
            <Text style={[styles.summaryValue, { color: pct >= 100 ? '#15803D' : '#0369A1' }]}>{pct.toFixed(0)}%</Text>
          </View>
        </View>

        {/* Payments table */}
        {payments.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 10, color: '#6B7280' }}>Sin abonos registrados</Text>
          </View>
        ) : (
          <View>
            <View style={styles.tableHeader} fixed>
              <Text style={[styles.tableHeaderText, styles.colSeq]}>#</Text>
              <Text style={[styles.tableHeaderText, styles.colDate]}>FECHA</Text>
              <Text style={[styles.tableHeaderText, styles.colMethod]}>MÉTODO</Text>
              <Text style={[styles.tableHeaderText, styles.colRef]}>REFERENCIA</Text>
              <Text style={[styles.tableHeaderText, styles.colAmount]}>ABONO</Text>
              <Text style={[styles.tableHeaderText, styles.colAccum]}>ACUMULADO</Text>
              <Text style={[styles.tableHeaderText, styles.colBalance]}>SALDO</Text>
            </View>
            {(() => {
              let accum = 0
              return payments.map((p, i) => {
                accum += Number(p.amount)
                const remaining = total - accum
                return (
                  <View key={p.seq} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]} wrap={false}>
                    <Text style={[styles.cellText, styles.colSeq, { color: '#6B7280' }]}>{p.seq}</Text>
                    <Text style={[styles.cellText, styles.colDate]}>{fmtDate(p.payment_date)}</Text>
                    <Text style={[styles.cellText, styles.colMethod]}>{METHOD_LABELS[p.payment_method] ?? p.payment_method}</Text>
                    <Text style={[styles.cellText, styles.colRef, { color: '#6B7280' }]}>{p.reference || '—'}</Text>
                    <Text style={[styles.cellText, styles.colAmount, { fontWeight: 'bold', color: '#15803D' }]}>${fmt(p.amount)}</Text>
                    <Text style={[styles.cellText, styles.colAccum, { color: '#0369A1' }]}>${fmt(accum)}</Text>
                    <Text style={[styles.cellText, styles.colBalance, { color: remaining <= 0 ? '#15803D' : '#EA580C' }]}>${fmt(remaining)}</Text>
                  </View>
                )
              })
            })()}
          </View>
        )}

        {/* SVG Footer */}
        <View style={styles.footerContainer} fixed>
          <Text style={[styles.website, { position: 'absolute', top: 0, left: 0, right: 0, textAlign: 'center' }]}>www.smart-systems.com.mx</Text>
          <Svg viewBox="0 0 595 50" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 50 }}>
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
