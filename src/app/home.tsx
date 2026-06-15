import { SafeAreaView, View, Text, Pressable, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { StatusBar } from 'react-native';
import { useRouter } from 'expo-router';

const TOURNAMENTS = [
  { id: 'ms-hokej', emoji: '🏒', name: 'MS Hokej' },
  { id: 'ms-fotbal', emoji: '⚽', name: 'MS Fotbal' },
  { id: 'me-fotbal', emoji: '🏆', name: 'ME Fotbal' },
  { id: 'zimni-olympiada', emoji: '❄️', name: 'Zimní Olympiáda' },
  { id: 'letni-olympiada', emoji: '🔥', name: 'Letní Olympiáda' },
  { id: 'extraliga', emoji: '🥅', name: 'Tipsport Extraliga' },
  { id: 'chance-liga', emoji: '⚡', name: 'Chance Liga' },
  { id: 'champions-league', emoji: '⭐', name: 'Champions League' },
  { id: 'statistiky', emoji: '📊', name: 'Celkové statistiky' },
];

export default function Home() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const isWide = width > 600;
  const cols = isWide ? 4 : 3;
  const gap = 10;
  const padding = 20;
  const tileSize = (width - padding * 2 - gap * (cols - 1)) / cols;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={[s.scroll, { padding }]}>
        <View style={s.header}>
          <Text style={s.eyebrow}>SK NADĚJE</Text>
          <Text style={s.title}>VYBER TURNAJ</Text>
        </View>
        <View style={[s.grid, { gap }]}>
          {TOURNAMENTS.map((t) => (
            <Pressable
              key={t.id}
              style={({ pressed }) => [
                s.tile,
                { width: tileSize, height: tileSize * 0.9, opacity: pressed ? 0.75 : 1 },
              ]}
              onPress={() => router.push('/turnaj/' + t.id)}
            >
              <Text style={s.tileEmoji}>{t.emoji}</Text>
              <Text style={s.tileName}>{t.name}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={s.adminBtn} onPress={() => router.push('/admin')}>
          <Text style={s.adminText}>⚙️  ADMIN</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#080C1A' },
  scroll: { flexGrow: 1 },
  header: { marginBottom: 20 },
  eyebrow: { color: '#B8972A', fontSize: 11, fontWeight: '700', letterSpacing: 3 },
  title: { color: '#F0C040', fontSize: 26, fontWeight: '900', letterSpacing: 1, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(184,151,42,0.25)', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8 },
  tileEmoji: { fontSize: 28 },
  tileName: { color: '#F0C040', fontSize: 11, fontWeight: '700', textAlign: 'center', letterSpacing: 0.3 },
  adminBtn: { marginTop: 24, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(184,151,42,0.3)', borderRadius: 12 },
  adminText: { color: '#B8972A', fontSize: 13, fontWeight: '700', letterSpacing: 2 },
});
