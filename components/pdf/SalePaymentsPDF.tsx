import { Document, Page, Text, View, StyleSheet, Image, Svg, Path } from '@react-pdf/renderer'
import { METHOD_LABELS } from '@/lib/constants/payments'

const styles = StyleSheet.create({
  page: { padding: '120 30 85 30', fontFamily: 'Helvetica', fontSize: 9, color: '#262626' },

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
  cellText: { fontSize: 8 },

  colNum: { width: '15%', paddingRight: 4 },
  colDate: { width: '10%', paddingRight: 4 },
  colConcept: { width: '11%', paddingRight: 4 },
  colMethod: { width: '12%', paddingRight: 4 },
  colAmount: { width: '12%', textAlign: 'right', paddingRight: 6 },
  colState: { width: '11%', paddingRight: 4 },
  colApplied: { width: '29%' },

  totalRow: { flexDirection: 'row', padding: '8 8', backgroundColor: '#F3F7FA', borderTop: '2 solid #1B3461', alignItems: 'center' },

  footerText: { fontSize: 7, color: '#9CA3AF', textAlign: 'center', marginTop: 10 },
  website: { fontSize: 13, color: '#1B3461', fontWeight: 'bold', marginBottom: 4 },
})

const fmt = (n: string | number) =>
  Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtDate = (s: string) => {
  const d = new Date(s + (s.length === 10 ? 'T12:00:00' : ''))
  return isNaN(d.getTime()) ? s : d.toLocaleDateString('es-MX')
}

const STATE_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Borrador', color: '#B45309' },
  confirmed: { label: 'Confirmado', color: '#0369A1' },
  cancelled: { label: 'Cancelado', color: '#BE123C' },
}

interface SaleData {
  number: string
  customer_name?: string
  amount_total: string
  amount_paid: string
  amount_balance: string
}

interface PaymentItem {
  id: string
  number: string
  state: string
  concept: string | null
  amount: string
  payment_method: string
  payment_date: string
  reference: string | null
}

interface SalePaymentApplication {
  payment_id: string
  note_id: string
  note_number: string
  amount: string
}

interface Props {
  sale: SaleData
  payments: PaymentItem[]
  applications: SalePaymentApplication[]
  filterNote: { id: string; number: string } | null
  logoPath: string
}

export default function SalePaymentsPDF({ sale, payments, applications, filterNote, logoPath }: Props) {
  const total = Number(sale.amount_total)
  const paid = Number(sale.amount_paid)
  const balance = Number(sale.amount_balance)
  const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0

  // Group applications by payment_id
  const appsByPayment: Record<string, SalePaymentApplication[]> = {}
  for (const app of applications) {
    if (!appsByPayment[app.payment_id]) appsByPayment[app.payment_id] = []
    appsByPayment[app.payment_id].push(app)
  }

  // Filter payments by note (same logic as SalePaymentsSection)
  let filteredPayments = payments
  if (filterNote) {
    const matchingIds = new Set(
      applications.filter(a => a.note_id === filterNote.id).map(a => a.payment_id)
    )
    filteredPayments = payments.filter(p => matchingIds.has(p.id))
  }

  const totalVisible = filteredPayments.reduce((s, p) => s + Number(p.amount), 0)

  const title = filterNote
    ? `PAGOS DE VENTA — ${filterNote.number}`
    : 'PAGOS DE VENTA'

  const genDate = new Date().toLocaleDateString('es-MX')

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
            {title}
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
            <Text style={styles.sectionTitle}>INFORMACIÓN</Text>
            <Text style={styles.label}>FECHA DE GENERACIÓN</Text>
            <Text style={styles.value}>{genDate}</Text>
            {filterNote && (
              <>
                <Text style={styles.label}>FILTRO ACTIVO</Text>
                <Text style={[styles.value, { fontWeight: 'bold' }]}>{filterNote.number}</Text>
              </>
            )}
            <Text style={styles.label}>PAGOS MOSTRADOS</Text>
            <Text style={styles.value}>{filteredPayments.length} de {payments.length}</Text>
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
        {filteredPayments.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 10, color: '#6B7280' }}>Sin pagos registrados</Text>
          </View>
        ) : (
          <View>
            <View style={styles.tableHeader} fixed>
              <Text style={[styles.tableHeaderText, styles.colNum]}>NÚMERO</Text>
              <Text style={[styles.tableHeaderText, styles.colDate]}>FECHA</Text>
              <Text style={[styles.tableHeaderText, styles.colConcept]}>CONCEPTO</Text>
              <Text style={[styles.tableHeaderText, styles.colMethod]}>MÉTODO</Text>
              <Text style={[styles.tableHeaderText, styles.colAmount]}>IMPORTE</Text>
              <Text style={[styles.tableHeaderText, styles.colState]}>ESTADO</Text>
              <Text style={[styles.tableHeaderText, styles.colApplied]}>APLICADO A</Text>
            </View>
            {filteredPayments.map((p, i) => {
              const st = STATE_LABELS[p.state] ?? STATE_LABELS.confirmed
              const appsForPayment = appsByPayment[p.id] ?? []
              const visibleApps = filterNote
                ? appsForPayment.filter(a => a.note_id === filterNote.id)
                : appsForPayment
              return (
                <View key={p.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]} wrap={false}>
                  <Text style={[styles.cellText, styles.colNum, { fontWeight: 'bold' }]}>{p.number}</Text>
                  <Text style={[styles.cellText, styles.colDate]}>{fmtDate(p.payment_date)}</Text>
                  <Text style={[styles.cellText, styles.colConcept, { color: '#6B7280' }]}>{p.concept || '—'}</Text>
                  <Text style={[styles.cellText, styles.colMethod]}>{METHOD_LABELS[p.payment_method] ?? p.payment_method}</Text>
                  <Text style={[styles.cellText, styles.colAmount, { fontWeight: 'bold', color: '#15803D' }]}>${fmt(p.amount)}</Text>
                  <Text style={[styles.cellText, styles.colState, { color: st.color, fontWeight: 'bold', fontSize: 7.5 }]}>{st.label}</Text>
                  <Text style={[styles.cellText, styles.colApplied, { color: '#1D4ED8', fontSize: 7.5 }]}>
                    {visibleApps.length === 0 ? '—' : visibleApps.map(a => `${a.note_number} ($${fmt(a.amount)})`).join(', ')}
                  </Text>
                </View>
              )
            })}
            {/* Total row */}
            <View style={styles.totalRow} wrap={false}>
              <Text style={[styles.cellText, styles.colNum, { fontWeight: 'bold' }]}>TOTAL</Text>
              <Text style={[styles.cellText, styles.colDate]} />
              <Text style={[styles.cellText, styles.colConcept]} />
              <Text style={[styles.cellText, styles.colMethod]} />
              <Text style={[styles.cellText, styles.colAmount, { fontWeight: 'bold', color: '#1B3461', fontSize: 10 }]}>${fmt(totalVisible)}</Text>
              <Text style={[styles.cellText, styles.colState]} />
              <Text style={[styles.cellText, styles.colApplied]} />
            </View>
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
