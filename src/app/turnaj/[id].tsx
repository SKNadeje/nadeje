import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SOUPISKY } from '../../lib/soupisky';
import { supabase } from '../../lib/supabase';
import { getObrazek } from '../../lib/tymy';

type Zapas = {
  id: string;
  domaci: string;
  hoste: string;
  datum: string;
  stav: string;
  vysledek_domaci: number | null;
  vysledek_hoste: number | null;
};

const TURNAJ_MAP: Record<string, string> = {
  'ms-hokej': 'MS Hokej',
  'ms-fotbal': 'MS Fotbal',
  'me-fotbal': 'ME Fotbal',
  'zimni-olympiada': 'Zimní Olympiáda',
  'letni-olympiada': 'Letní Olympiáda',
  'extraliga': 'Tipsport Extraliga',
  'chance-liga': 'Chance Liga',
  'champions-league': 'Champions League',
};

export default function Turnaj() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [zapasy, setZapasy] = useState<Zapas[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipy, setTipy] = useState<Record<string, { domaci: string; hoste: string; strelec: string }>>({});
  const [ulozeno, setUlozeno] = useState<Record<string, boolean>>({});
  const [chyba, setChyba] = useState<Record<string, string>>({});
  const [modalZapas, setModalZapas] = useState<Zapas | null>(null);
  const [vybranyTym, setVybranyTym] = useState<'domaci' | 'hoste' | null>(null);
  const [search, setSearch] = useState('');

  const turnajNazev = TURNAJ_MAP[id as string] || (id as string);

  useEffect(() => { nactiVse(); }, [id]);

  async function nactiVse() {
    setLoading(true);
    const { data: zapasyData } = await supabase
      .from('zapasy')
      .select('*')
      .eq('turnaj', turnajNazev)
      .order('datum', { ascending: true });

    setZapasy(zapasyData || []);

    const { data: { user } } = await supabase.auth.getUser();
    if (user && zapasyData && zapasyData.length > 0) {
      const zapasIds = zapasyData.map(z => z.id);
      const { data: tipyData } = await supabase
        .from('tipy_nadeje')
        .select('*')
        .eq('user_id', user.id)
        .in('zapas_id', zapasIds);

      if (tipyData && tipyData.length > 0) {
        const tipyMap: Record<string, { domaci: string; hoste: string; strelec: string }> = {};
        const ulozenoMap: Record<string, boolean> = {};
        tipyData.forEach(t => {
          tipyMap[t.zapas_id] = {
            domaci: t.tip_domaci?.toString() || '',
            hoste: t.tip_hoste?.toString() || '',
            strelec: t.tip_strelec || '',
          };
          ulozenoMap[t.zapas_id] = true;
        });
        setTipy(tipyMap);
        setUlozeno(ulozenoMap);
      }
    }
    setLoading(false);
  }

  async function odeslat(z: Zapas) {
    const tip = tipy[z.id];
    setChyba(prev => ({ ...prev, [z.id]: '' }));
    if (!tip?.domaci || !tip?.hoste) {
      setChyba(prev => ({ ...prev, [z.id]: 'Vyplň tip skóre.' }));
      return;
    }
    if (!tip?.strelec) {
      setChyba(prev => ({ ...prev, [z.id]: 'Vyber střelce.' }));
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const now = new Date();
    const zapasStart = new Date(z.datum);
    if (now >= zapasStart) {
      setChyba(prev => ({ ...prev, [z.id]: 'Zápas již začal, tip nelze měnit.' }));
      return;
    }

    const { error } = await supabase.from('tipy_nadeje').upsert({
      zapas_id: z.id,
      user_id: user.id,
      tip_domaci: parseInt(tip.domaci),
      tip_hoste: parseInt(tip.hoste),
      tip_strelec: tip.strelec,
    }, { onConflict: 'zapas_id,user_id' });
    if (error) setChyba(prev => ({ ...prev, [z.id]: error.message }));
    else setUlozeno(prev => ({ ...prev, [z.id]: true }));
  }

  const formatDatum = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' }) + ' · ' +
      d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
  };

  const zapasZacal = (datum: string) => new Date() >= new Date(datum);

  const hraci = modalZapas && vybranyTym
    ? (SOUPISKY[modalZapas[vybranyTym]] || []).filter(h => h.toLowerCase().includes(search.toLowerCase()))
    : [];

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Pressable onPress={() => router.back()} style={s.back}>
          <Text style={s.backText}>← ZPĚT</Text>
        </Pressable>
        <Text style={s.eyebrow}>SK NADĚJE</Text>
        <Text style={s.title}>{turnajNazev.toUpperCase()}</Text>

        {loading && <Text style={s.info}>Načítám zápasy…</Text>}
        {!loading && zapasy.length === 0 && <Text style={s.info}>Zatím žádné zápasy. Admin je přidá.</Text>}

        {zapasy.map(z => {
          const maVysledek = z.vysledek_domaci !== null && z.vysledek_hoste !== null;
          const zacal = zapasZacal(z.datum);
          const maTip = ulozeno[z.id];

          return (
            <View key={z.id} style={s.card}>
              <Text style={s.datum}>{formatDatum(z.datum)}</Text>

              {maVysledek && (
                <View style={s.vysledekBadge}>
                  <Text style={s.vysledekText}>VÝSLEDEK {z.vysledek_domaci}:{z.vysledek_hoste}</Text>
                </View>
              )}

              {zacal && !maVysledek && (
                <View style={s.zacalBadge}>
                  <Text style={s.zacalText}>🔴 PROBÍHÁ</Text>
                </View>
              )}

              <View style={s.zapasRow}>
                <View style={s.tym}>
                  {getObrazek(z.domaci)
                    ? <Image source={{ uri: getObrazek(z.domaci)! }} style={s.vlajka} resizeMode="contain" />
                    : <View style={s.vlajkaPlaceholder} />}
                  <Text style={s.tymNazev}>{z.domaci}</Text>
                </View>
                <View style={s.vsKruh}><Text style={s.vsText}>VS</Text></View>
                <View style={s.tym}>
                  {getObrazek(z.hoste)
                    ? <Image source={{ uri: getObrazek(z.hoste)! }} style={s.vlajka} resizeMode="contain" />
                    : <View style={s.vlajkaPlaceholder} />}
                  <Text style={s.tymNazev}>{z.hoste}</Text>
                </View>
              </View>

              {!maVysledek && !zacal && (
                <>
                  <View style={s.tipRow}>
                    <TextInput
                      style={s.tipInput}
                      placeholder="0"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      keyboardType="numeric"
                      maxLength={2}
                      value={tipy[z.id]?.domaci || ''}
                      onChangeText={v => {
                        setUlozeno(prev => ({ ...prev, [z.id]: false }));
                        setTipy(prev => ({ ...prev, [z.id]: { ...prev[z.id], domaci: v } }));
                      }}
                    />
                    <Text style={s.tipDvtecka}>:</Text>
                    <TextInput
                      style={s.tipInput}
                      placeholder="0"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      keyboardType="numeric"
                      maxLength={2}
                      value={tipy[z.id]?.hoste || ''}
                      onChangeText={v => {
                        setUlozeno(prev => ({ ...prev, [z.id]: false }));
                        setTipy(prev => ({ ...prev, [z.id]: { ...prev[z.id], hoste: v } }));
                      }}
                    />
                  </View>

                  <Text style={s.strelecLabel}>STŘELEC *</Text>

                  {tipy[z.id]?.strelec ? (
                    <Pressable style={s.strelecVybrany} onPress={() => { setModalZapas(z); setVybranyTym(null); setSearch(''); setUlozeno(prev => ({ ...prev, [z.id]: false })); }}>
                      <Text style={s.strelecVybranyText}>⚡ {tipy[z.id].strelec}</Text>
                      <Text style={s.zmenitText}>ZMĚNIT</Text>
                    </Pressable>
                  ) : (
                    <Pressable style={s.strelecBtn} onPress={() => { setModalZapas(z); setVybranyTym(null); setSearch(''); }}>
                      <Text style={s.placeholder}>Vyber střelce...</Text>
                      <Text style={s.arrow}>▼</Text>
                    </Pressable>
                  )}

                  {chyba[z.id] ? <Text style={s.chyba}>{chyba[z.id]}</Text> : null}

                  <Pressable
                    style={({ pressed }) => [s.btn, maTip && s.btnUlozeno, pressed && { opacity: 0.8 }]}
                    onPress={() => odeslat(z)}
                  >
                    <Text style={s.btnText}>{maTip ? '✓ TIP ULOŽEN — KLIKNI PRO ZMĚNU' : 'ULOŽIT TIP'}</Text>
                  </Pressable>
                </>
              )}

              {zacal && maTip && !maVysledek && (
                <View style={s.tipUzamcen}>
                  <Text style={s.tipUzamcenText}>
                    Tvůj tip: {tipy[z.id]?.domaci}:{tipy[z.id]?.hoste} · Střelec: {tipy[z.id]?.strelec}
                  </Text>
                </View>
              )}

              {zacal && !maTip && !maVysledek && (
                <Text style={s.chyba}>Zápas již začal — tip nelze zadat.</Text>
              )}
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={modalZapas !== null && vybranyTym === null} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>VYBER TÝM</Text>
            <View style={s.tymVyberRow}>
              <Pressable style={s.tymVyberBtn} onPress={() => setVybranyTym('domaci')}>
                {modalZapas && getObrazek(modalZapas.domaci) && (
                  <Image source={{ uri: getObrazek(modalZapas.domaci)! }} style={s.modalVlajka} resizeMode="contain" />
                )}
                <Text style={s.tymVyberText}>{modalZapas?.domaci}</Text>
              </Pressable>
              <Pressable style={s.tymVyberBtn} onPress={() => setVybranyTym('hoste')}>
                {modalZapas && getObrazek(modalZapas.hoste) && (
                  <Image source={{ uri: getObrazek(modalZapas.hoste)! }} style={s.modalVlajka} resizeMode="contain" />
                )}
                <Text style={s.tymVyberText}>{modalZapas?.hoste}</Text>
              </Pressable>
            </View>
            <Pressable style={s.modalClose} onPress={() => setModalZapas(null)}>
              <Text style={s.modalCloseText}>ZAVŘÍT</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={modalZapas !== null && vybranyTym !== null} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Pressable onPress={() => setVybranyTym(null)} style={{ marginBottom: 12 }}>
              <Text style={s.backText}>← ZPĚT NA VÝBĚR TÝMU</Text>
            </Pressable>
            <Text style={s.modalTitle}>
              {modalZapas && vybranyTym ? modalZapas[vybranyTym].toUpperCase() : ''}
            </Text>
            <TextInput
              style={s.searchInput}
              placeholder="Hledat hráče..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={search}
              onChangeText={setSearch}
            />
            <ScrollView style={{ maxHeight: 350 }}>
              {hraci.map(h => (
                <Pressable key={h} style={s.modalItem} onPress={() => {
                  setTipy(prev => ({ ...prev, [modalZapas!.id]: { ...prev[modalZapas!.id], strelec: h } }));
                  setModalZapas(null);
                  setVybranyTym(null);
                }}>
                  <Text style={s.modalItemText}>{h}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={s.modalClose} onPress={() => { setModalZapas(null); setVybranyTym(null); }}>
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
  scroll: { padding: 20, paddingBottom: 60 },
  back: { marginBottom: 16 },
  backText: { color: '#B8972A', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  eyebrow: { color: '#B8972A', fontSize: 11, fontWeight: '700', letterSpacing: 3 },
  title: { color: '#F0C040', fontSize: 24, fontWeight: '900', letterSpacing: 1, marginTop: 4, marginBottom: 24 },
  info: { color: 'rgba(255,255,255,0.4)', fontSize: 15, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(184,151,42,0.2)', padding: 20, marginBottom: 16 },
  datum: { color: '#B8972A', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 16, textAlign: 'center' },
  vysledekBadge: { position: 'absolute', top: 16, right: 16, backgroundColor: '#2A7A3A', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  vysledekText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  zacalBadge: { position: 'absolute', top: 16, right: 16, backgroundColor: '#7A1A1A', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  zacalText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  zapasRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  tym: { flex: 1, alignItems: 'center', gap: 10 },
  vlajka: { width: 72, height: 48, borderRadius: 8 },
  vlajkaPlaceholder: { width: 72, height: 48, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)' },
  tymNazev: { color: '#F0C040', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  vsKruh: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,180,220,0.15)', borderWidth: 1.5, borderColor: 'rgba(0,180,220,0.4)', alignItems: 'center', justifyContent: 'center' },
  vsText: { color: '#00B4DC', fontSize: 13, fontWeight: '900' },
  tipRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 },
  tipInput: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(184,151,42,0.35)', paddingHorizontal: 20, paddingVertical: 14, color: '#F0C040', fontSize: 24, fontWeight: '900', textAlign: 'center', width: 80 },
  tipDvtecka: { color: '#F0C040', fontSize: 28, fontWeight: '900' },
  strelecLabel: { color: '#B8972A', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  strelecBtn: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(184,151,42,0.35)', paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  strelecVybrany: { backgroundColor: 'rgba(184,151,42,0.15)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(184,151,42,0.5)', paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  strelecVybranyText: { color: '#F0C040', fontSize: 15, fontWeight: '700' },
  zmenitText: { color: '#B8972A', fontSize: 12, fontWeight: '700' },
  placeholder: { color: 'rgba(255,255,255,0.25)', fontSize: 15 },
  arrow: { color: '#B8972A', fontSize: 12 },
  chyba: { color: '#FF6B6B', fontSize: 13, textAlign: 'center', marginBottom: 8 },
  btn: { backgroundColor: '#B8972A', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#F0C040' },
  btnUlozeno: { backgroundColor: '#2A7A3A', borderColor: '#4CAF50' },
  btnText: { color: '#080C1A', fontSize: 14, fontWeight: '800', letterSpacing: 2 },
  tipUzamcen: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12, marginTop: 4 },
  tipUzamcenText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#0F1A2E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  modalTitle: { color: '#F0C040', fontSize: 16, fontWeight: '900', letterSpacing: 2, marginBottom: 16, textAlign: 'center' },
  tymVyberRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  tymVyberBtn: { flex: 1, alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(184,151,42,0.3)', paddingVertical: 20 },
  modalVlajka: { width: 64, height: 42, borderRadius: 6 },
  tymVyberText: { color: '#F0C040', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  searchInput: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(184,151,42,0.35)', paddingHorizontal: 16, paddingVertical: 12, color: '#F0C040', fontSize: 15, marginBottom: 12 },
  modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  modalItemText: { color: '#F0C040', fontSize: 15 },
  modalClose: { marginTop: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(184,151,42,0.3)', borderRadius: 12 },
  modalCloseText: { color: '#B8972A', fontSize: 14, fontWeight: '700', letterSpacing: 2 },
});