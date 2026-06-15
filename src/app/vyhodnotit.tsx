import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';

type Zapas = {
  id: string;
  domaci: string;
  hoste: string;
  datum: string;
  turnaj: string;
  stav: string;
  vysledek_domaci: number | null;
  vysledek_hoste: number | null;
};

export default function Vyhodnotit() {
  const router = useRouter();
  const [zapasy, setZapasy] = useState<Zapas[]>([]);
  const [vybrany, setVybrany] = useState<Zapas | null>(null);
  const [vysledekD, setVysledekD] = useState('');
  const [vysledekH, setVysledekH] = useState('');
  const [strelci, setStrelci] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => { nactiZapasy(); }, []);

  async function nactiZapasy() {
    const { data } = await supabase
      .from('zapasy')
      .select('*')
      .is('vysledek_domaci', null)
      .order('datum', { ascending: true });
    setZapasy(data || []);
  }

  async function vyhodnotit() {
    if (!vybrany || !vysledekD || !vysledekH) {
      setError('Vyber zápas a zadej výsledek.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    const fD = parseInt(vysledekD);
    const fH = parseInt(vysledekH);
    const strelciNorm = strelci.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const { error: updErr } = await supabase
      .from('zapasy')
      .update({ vysledek_domaci: fD, vysledek_hoste: fH, strelci, stav: 'dokoncen' })
      .eq('id', vybrany.id);

    if (updErr) { setError(updErr.message); setLoading(false); return; }

    const { data: tipy } = await supabase
      .from('tipy_nadeje')
      .select('*')
      .eq('zapas_id', vybrany.id);

    if (tipy && tipy.length > 0) {
      for (const tip of tipy) {
        const hitsScore = tip.tip_domaci === fD && tip.tip_hoste === fH;
        const tipStrelecNorm = (tip.tip_strelec || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        const hitsStriker = tipStrelecNorm.length > 2 && strelciNorm.includes(tipStrelecNorm);
        let hitsTrend = false;
        if (fD > fH && tip.tip_domaci > tip.tip_hoste) hitsTrend = true;
        else if (fD < fH && tip.tip_domaci < tip.tip_hoste) hitsTrend = true;
        else if (fD === fH && tip.tip_domaci === tip.tip_hoste) hitsTrend = true;

        let body = 0;
        if (hitsScore) body += 5;
        if (hitsStriker) body += 3;
        if (hitsTrend) body += 1;

        await supabase
          .from('tipy_nadeje')
          .update({ body_ziskane: body })
          .eq('id', tip.id);

        await supabase
          .from('profiles')
          .update({
            celkove_body: supabase.rpc('increment', { x: body }),
            trefene_skore: hitsScore ? supabase.rpc('increment', { x: 1 }) : undefined,
            trefeni_strelci: hitsStriker ? supabase.rpc('increment', { x: 1 }) : undefined,
            trefeny_trend: hitsTrend ? supabase.rpc('increment', { x: 1 }) : undefined,
          })
          .eq('id', tip.user_id);
      }
    }

    setLoading(false);
    setSuccess(`Hotovo! Vyhodnoceno ${tipy?.length || 0} tipů.`);
    setVybrany(null);
    setVysledekD('');
    setVysledekH('');
    setStrelci('');
    nactiZapasy();
  }

  const formatDatum = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' }) + ' · ' +
      d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Pressable onPress={() => router.back()} style={s.back}>
          <Text style={s.backText}>← ZPĚT</Text>
        </Pressable>
        <Text style={s.eyebrow}>SK NADĚJE</Text>
        <Text style={s.title}>VYHODNOTIT ZÁPAS</Text>

        <Text style={s.label}>VYBER ZÁPAS</Text>
        <Pressable style={s.select} onPress={() => setModalOpen(true)}>
          <Text style={[s.selectText, !vybrany && s.placeholder]}>
            {vybrany ? `${vybrany.domaci} vs ${vybrany.hoste} (${vybrany.turnaj})` : 'Vyber zápas...'}
          </Text>
          <Text style={s.arrow}>▼</Text>
        </Pressable>

        <View style={s.scoreRow}>
          <View style={s.scoreBlock}>
            <Text style={s.label}>{vybrany?.domaci || 'DOMÁCÍ'}</Text>
            <TextInput style={s.scoreInput} placeholder="0" placeholderTextColor="rgba(255,255,255,0.25)" value={vysledekD} onChangeText={setVysledekD} keyboardType="numeric" maxLength={2} />
          </View>
          <Text style={s.scoreDvtecka}>:</Text>
          <View style={s.scoreBlock}>
            <Text style={s.label}>{vybrany?.hoste || 'HOSTÉ'}</Text>
            <TextInput style={s.scoreInput} placeholder="0" placeholderTextColor="rgba(255,255,255,0.25)" value={vysledekH} onChangeText={setVysledekH} keyboardType="numeric" maxLength={2} />
          </View>
        </View>

        <Text style={s.label}>STŘELCI (oddělení čárkou)</Text>
        <TextInput
          style={s.input}
          placeholder="Nečas, Hertl, Kubalík..."
          placeholderTextColor="rgba(255,255,255,0.25)"
          value={strelci}
          onChangeText={setStrelci}
        />

        {error && <Text style={s.error}>{error}</Text>}
        {success && <Text style={s.successMsg}>{success}</Text>}

        <Pressable style={({ pressed }) => [s.cta, pressed && { opacity: 0.85 }]} onPress={vyhodnotit} disabled={loading}>
          <Text style={s.ctaText}>{loading ? 'Vyhodnocuji…' : '⚡ VYHODNOTIT A PŘEPOČÍTAT BODY'}</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>VYBER ZÁPAS</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {zapasy.length === 0 && (
                <Text style={s.placeholder}>Žádné nevyhodnocené zápasy.</Text>
              )}
              {zapasy.map(z => (
                <Pressable key={z.id} style={s.modalItem} onPress={() => { setVybrany(z); setModalOpen(false); }}>
                  <Text style={s.modalItemText}>{z.domaci} vs {z.hoste}</Text>
                  <Text style={s.modalItemSub}>{z.turnaj} · {formatDatum(z.datum)}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={s.modalClose} onPress={() => setModalOpen(false)}>
              <Text style={s.modalCloseText}>ZAVŘÍT</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#080C1A' },
  scroll: { padding: 24, paddingBottom: 60 },
  back: { marginBottom: 16 },
  backText: { color: '#B8972A', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  eyebrow: { color: '#B8972A', fontSize: 11, fontWeight: '700', letterSpacing: 3 },
  title: { color: '#F0C040', fontSize: 26, fontWeight: '900', letterSpacing: 1, marginBottom: 24 },
  label: { color: '#B8972A', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  select: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(184,151,42,0.35)', paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectText: { color: '#F0C040', fontSize: 15, flex: 1 },
  placeholder: { color: 'rgba(255,255,255,0.25)', fontSize: 15 },
  arrow: { color: '#B8972A', fontSize: 12 },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 16, marginBottom: 20 },
  scoreBlock: { alignItems: 'center', gap: 6 },
  scoreInput: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(184,151,42,0.35)', paddingHorizontal: 20, paddingVertical: 14, color: '#F0C040', fontSize: 28, fontWeight: '900', textAlign: 'center', width: 90 },
  scoreDvtecka: { color: '#F0C040', fontSize: 32, fontWeight: '900', marginBottom: 14 },
  input: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(184,151,42,0.35)', paddingHorizontal: 16, paddingVertical: 14, color: '#F0C040', fontSize: 15, marginBottom: 20 },
  error: { color: '#FF6B6B', fontSize: 13, textAlign: 'center', marginBottom: 12 },
  successMsg: { color: '#4CAF50', fontSize: 13, textAlign: 'center', marginBottom: 12 },
  cta: { backgroundColor: '#FF6B4A', borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#FF8C6A' },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#0F1A2E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  modalTitle: { color: '#F0C040', fontSize: 16, fontWeight: '900', letterSpacing: 2, marginBottom: 16, textAlign: 'center' },
  modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  modalItemText: { color: '#F0C040', fontSize: 15, fontWeight: '700' },
  modalItemSub: { color: '#B8972A', fontSize: 12, marginTop: 3 },
  modalClose: { marginTop: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(184,151,42,0.3)', borderRadius: 12 },
  modalCloseText: { color: '#B8972A', fontSize: 14, fontWeight: '700', letterSpacing: 2 },
});