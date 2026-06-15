import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';

const TYMY: Record<string, string[]> = {
  'MS Hokej': ['Česko','Slovensko','Kanada','USA','Rusko','Finsko','Švédsko','Německo','Švýcarsko','Lotyšsko','Dánsko','Norsko','Rakousko','Francie','Maďarsko','Kazachstán','Velká Británie','Polsko'],
  'MS Fotbal': ['Česko','Slovensko','Německo','Francie','Španělsko','Itálie','Anglie','Brazílie','Argentina','Portugalsko','Belgie','Nizozemsko','Chorvatsko','Polsko','Dánsko','Švýcarsko','USA','Mexiko','Kanada','Japonsko','Jižní Korea','Maroko','Senegal','Austrálie'],
  'ME Fotbal': ['Česko','Slovensko','Německo','Francie','Španělsko','Itálie','Anglie','Portugalsko','Belgie','Nizozemsko','Chorvatsko','Polsko','Dánsko','Švýcarsko','Maďarsko','Turecko','Rakousko','Skotsko','Srbsko','Slovinsko','Albánie','Rumunsko','Gruzie','Ukrajina'],
  'Zimní Olympiáda': ['Česko','Slovensko','Kanada','USA','Rusko','Finsko','Švédsko','Německo','Švýcarsko','Norsko','Rakousko','Japonsko','Jižní Korea','Čína'],
  'Letní Olympiáda': ['Česko','Slovensko','USA','Brazílie','Německo','Francie','Japonsko','Austrálie','Velká Británie','Čína','Španělsko','Itálie','Nizozemsko','Maďarsko'],
  'Tipsport Extraliga': ['HC Oceláři Třinec','HC Sparta Praha','HC Kometa Brno','BK Mladá Boleslav','HC Mountfield HK','HC Škoda Plzeň','HC Dynamo Pardubice','HC Vítkovice','HC Olomouc','HC Litvínov','PSG Berani Zlín','HC Energie Karlovy Vary','HC Dukla Jihlava'],
  'Chance Liga': ['HC Dukla Jihlava','HC Frýdek-Místek','HC Prostějov','SK Kadaň','HC Poruba','HC Šumperk','AZ Havířov','HC Benátky nad Jizerou','SHC Kolin','HC Vrchlabí','VHK Vsetín','HC Slavia Praha'],
  'Champions League': ['Real Madrid','Manchester City','Bayern Mnichov','PSG','Barcelona','Liverpool','Chelsea','Arsenal','Juventus','Inter Milán','AC Milán','Atletico Madrid','Borussia Dortmund','Ajax','Porto','Benfica'],
};

const TURNAJE = Object.keys(TYMY);

export default function Admin() {
  const router = useRouter();
  const [turnaj, setTurnaj] = useState('MS Hokej');
  const [domaci, setDomaci] = useState('');
  const [hoste, setHoste] = useState('');
  const [datum, setDatum] = useState('');
  const [cas, setCas] = useState('18:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modalTyp, setModalTyp] = useState<'domaci'|'hoste'|null>(null);
  const [search, setSearch] = useState('');

  const tymy = TYMY[turnaj] || [];
  const filtrovane = tymy.filter(t => t.toLowerCase().includes(search.toLowerCase()));

  async function pridatZapas() {
    setError(null);
    setSuccess(null);
    if (!domaci || !hoste || !datum || !cas) {
      setError('Vyplň všechna pole.');
      return;
    }
    setLoading(true);
    const datumCas = new Date(`${datum}T${cas}:00`);
    const { error: err } = await supabase.from('zapasy').insert({
      turnaj, domaci, hoste,
      datum: datumCas.toISOString(),
    });
    setLoading(false);
    if (err) setError(err.message);
    else {
      setSuccess('Zápas byl přidán!');
      setDomaci(''); setHoste(''); setDatum(''); setCas('18:00');
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Pressable onPress={() => router.back()} style={s.back}>
          <Text style={s.backText}>← ZPĚT</Text>
        </Pressable>
        <Text style={s.eyebrow}>SK NADĚJE</Text>
        <Text style={s.title}>ADMIN</Text>
        <Text style={s.section}>PŘIDAT ZÁPAS</Text>

        <Text style={s.label}>TURNAJ</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          <View style={s.pills}>
            {TURNAJE.map(t => (
              <Pressable key={t} style={[s.pill, turnaj === t && s.pillActive]} onPress={() => { setTurnaj(t); setDomaci(''); setHoste(''); }}>
                <Text style={[s.pillText, turnaj === t && s.pillTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <Text style={s.label}>DOMÁCÍ</Text>
        <Pressable style={s.select} onPress={() => { setModalTyp('domaci'); setSearch(''); }}>
          <Text style={[s.selectText, !domaci && s.placeholder]}>{domaci || 'Vyber tým...'}</Text>
          <Text style={s.arrow}>▼</Text>
        </Pressable>

        <Text style={s.label}>HOSTÉ</Text>
        <Pressable style={s.select} onPress={() => { setModalTyp('hoste'); setSearch(''); }}>
          <Text style={[s.selectText, !hoste && s.placeholder]}>{hoste || 'Vyber tým...'}</Text>
          <Text style={s.arrow}>▼</Text>
        </Pressable>

        <Text style={s.label}>DATUM (RRRR-MM-DD)</Text>
        <TextInput style={s.input} placeholder="2025-05-10" placeholderTextColor="rgba(255,255,255,0.25)" value={datum} onChangeText={setDatum} />

        <Text style={s.label}>ČAS (HH:MM)</Text>
        <TextInput style={s.input} placeholder="18:00" placeholderTextColor="rgba(255,255,255,0.25)" value={cas} onChangeText={setCas} />

        {error && <Text style={s.error}>{error}</Text>}
        {success && <Text style={s.successMsg}>{success}</Text>}

        <Pressable style={({ pressed }) => [s.cta, pressed && { opacity: 0.85 }]} onPress={pridatZapas} disabled={loading}>
          <Text style={s.ctaText}>{loading ? 'Ukládám…' : 'PŘIDAT ZÁPAS'}</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={modalTyp !== null} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>VYBER TÝM</Text>
            <TextInput style={s.searchInput} placeholder="Hledat..." placeholderTextColor="rgba(255,255,255,0.3)" value={search} onChangeText={setSearch} />
            <ScrollView style={{ maxHeight: 400 }}>
              {filtrovane.map(t => (
                <Pressable key={t} style={s.modalItem} onPress={() => {
                  if (modalTyp === 'domaci') setDomaci(t);
                  else setHoste(t);
                  setModalTyp(null);
                }}>
                  <Text style={s.modalItemText}>{t}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={s.modalClose} onPress={() => setModalTyp(null)}>
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
  title: { color: '#F0C040', fontSize: 28, fontWeight: '900', letterSpacing: 1, marginBottom: 24 },
  section: { color: '#B8972A', fontSize: 13, fontWeight: '700', letterSpacing: 2, marginBottom: 16 },
  label: { color: '#B8972A', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  input: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(184,151,42,0.35)', paddingHorizontal: 16, paddingVertical: 14, color: '#F0C040', fontSize: 15, marginBottom: 14 },
  select: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(184,151,42,0.35)', paddingHorizontal: 16, paddingVertical: 14, marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectText: { color: '#F0C040', fontSize: 15 },
  placeholder: { color: 'rgba(255,255,255,0.25)' },
  arrow: { color: '#B8972A', fontSize: 12 },
  pills: { flexDirection: 'row', gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(184,151,42,0.3)', backgroundColor: 'rgba(255,255,255,0.04)' },
  pillActive: { backgroundColor: '#B8972A', borderColor: '#F0C040' },
  pillText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' },
  pillTextActive: { color: '#080C1A' },
  error: { color: '#FF6B6B', fontSize: 13, textAlign: 'center', marginBottom: 12 },
  successMsg: { color: '#4CAF50', fontSize: 13, textAlign: 'center', marginBottom: 12 },
  cta: { backgroundColor: '#B8972A', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: '#F0C040' },
  ctaText: { color: '#080C1A', fontSize: 15, fontWeight: '800', letterSpacing: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#0F1A2E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  modalTitle: { color: '#F0C040', fontSize: 16, fontWeight: '900', letterSpacing: 2, marginBottom: 16, textAlign: 'center' },
  searchInput: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(184,151,42,0.35)', paddingHorizontal: 16, paddingVertical: 12, color: '#F0C040', fontSize: 15, marginBottom: 12 },
  modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  modalItemText: { color: '#F0C040', fontSize: 15 },
  modalClose: { marginTop: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(184,151,42,0.3)', borderRadius: 12 },
  modalCloseText: { color: '#B8972A', fontSize: 14, fontWeight: '700', letterSpacing: 2 },
});