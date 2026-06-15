import { SafeAreaView, View, Text, StyleSheet } from 'react-native';

export default function Vyhodnotit() {
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <Text style={s.title}>VYHODNOTIT</Text>
        <Text style={s.sub}>Brzy zde bude vyhodnocení zápasů.</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#080C1A' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: '#F0C040', fontSize: 28, fontWeight: '900', letterSpacing: 1 },
  sub: { color: 'rgba(255,255,255,0.5)', fontSize: 15, marginTop: 12, textAlign: 'center' },
});
