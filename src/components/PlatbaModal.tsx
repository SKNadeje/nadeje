import { Modal, View, Text, Image, Pressable, StyleSheet } from 'react-native';

const CISLO_UCTU = '295511827';
const KOD_BANKY = '0300';
const UCET_ZOBRAZENI = '295511827 / 0300';

function vypoctiIBAN(cislo: string, banka: string) {
  let prefix = '', acct = cislo;
  if (cislo.includes('-')) { const [p, a] = cislo.split('-'); prefix = p; acct = a; }
  const bban = banka.padStart(4, '0') + prefix.padStart(6, '0') + acct.padStart(10, '0');
  const rear = bban + 'CZ00';
  const num = rear.split('').map(c => /[A-Z]/.test(c) ? (c.charCodeAt(0) - 55).toString() : c).join('');
  let rem = 0;
  for (const ch of num) rem = (rem * 10 + Number(ch)) % 97;
  const check = (98 - rem).toString().padStart(2, '0');
  return 'CZ' + check + bban;
}

export function PlatbaModal({ visible, castka, onClose }: { visible: boolean; castka: number; onClose: () => void }) {
  const iban = vypoctiIBAN(CISLO_UCTU, KOD_BANKY);
  const spayd = `SPD*1.0*ACC:${iban}*AM:${castka.toFixed(2)}*CC:CZK*MSG:NADEJE TIP`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(spayd)}`;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.box}>
          <Text style={s.title}>✅ TIKET PŘIJAT</Text>
          <Text style={s.sub}>Platbu proveď obratem. Sázky aktivujeme po připsání peněz.</Text>

          <View style={s.qrWrap}>
            <Image source={{ uri: qrUrl }} style={s.qr} />
          </View>

          <View style={s.radek}><Text style={s.label}>ÚČET</Text><Text style={s.hodnota}>{UCET_ZOBRAZENI}</Text></View>
          <View style={s.radek}><Text style={s.label}>ČÁSTKA</Text><Text style={s.castka}>{castka} Kč</Text></View>
          <View style={s.radek}><Text style={s.label}>ZPRÁVA</Text><Text style={s.hodnota}>NADEJE TIP</Text></View>

          <Pressable style={s.btn} onPress={onClose}>
            <Text style={s.btnText}>ZAVŘÍT TIKET</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  box: { backgroundColor: '#0E1530', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(240,192,64,0.25)', padding: 24, width: '100%', maxWidth: 360, alignItems: 'center' },
  title: { color: '#5DCAA5', fontSize: 18, fontWeight: '900', letterSpacing: 1, marginBottom: 6 },
  sub: { color: '#9DA8C0', fontSize: 13, textAlign: 'center', marginBottom: 18, lineHeight: 18 },
  qrWrap: { backgroundColor: '#fff', borderRadius: 16, padding: 10, marginBottom: 18 },
  qr: { width: 200, height: 200 },
  radek: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  label: { color: '#B8972A', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  hodnota: { color: '#F5F1E6', fontSize: 14, fontWeight: '700' },
  castka: { color: '#F0C040', fontSize: 18, fontWeight: '900' },
  btn: { backgroundColor: '#F0C040', borderRadius: 12, paddingVertical: 15, alignItems: 'center', width: '100%', marginTop: 20 },
  btnText: { color: '#080C1A', fontSize: 14, fontWeight: '800', letterSpacing: 2 },
});
