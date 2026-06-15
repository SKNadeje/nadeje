export const SOUPISKY: Record<string, string[]> = {
  'Česko': ['Kváča','Postava','Vladař','Hronek','Jiříček','Košťálek','Kempný','Šimek','Zbořil','Blümel','Červenka','Chytil','Flek','Hertl','Horák','Jaškin','Kämpf','Kubalík','Kučeřík','Lauko','Nečas','Palát','Voženílek','Zohorna'],
  'Kanada': ['Crosby','MacKinnon','Draisaitl','Point','Marchessault','Barkov','Tkachuk M.','Giroux','Huberdeau','Gaudreau','Stone','Scheifele','Barzal','Couture','Forsberg'],
  'Švédsko': ['Ekblad','Hedman','Karlsson E.','Pettersson','Forsberg','Zibanejad','Backstrom','Larsson','Raymond','Ekman-Larsson'],
  'Finsko': ['Barkov A.','Granlund','Lundell','Räty','Heinola','Jokiharju','Männinen','Björninen','Helenius','Hämeenaho','Kuokkanen','Puljujärvi','Annunen','Korpisalo'],
  'USA': ['Tkachuk M.','Hagens','Leonard','Moore O.','Novak','Coronato','Cotter','Lafferty','Steeves','Borgen','Carlile','Faulk','Kaiser','Lohrei','Woll'],
  'Německo': ['Seider','Gawanke','Grubauer','Kahun','Kastner','Reichel','Bokk','Tiffels','Wagner F.','Michaelis','Loibl','Fischbuch'],
  'Švýcarsko': ['Josi','Hischier','Meier','Niederreiter','Suter','Moser','Andrighetto','Malgin','Bertschy','Genoni','Berra'],
  'Slovensko': ['Slafkovský','Tatar','Pánik','Lantoši','Cehlárik','Rosandič','Grman','Nemec','Haščák'],
  'Lotyšsko': ['Balcers','Vilmanis','Dzierkals','Freibergs','Gudļevskis','Krastenbergs','Egle'],
  'Dánsko': ['Ehlers','Brock','Larsen','Regin','Storm','Jensen'],
  'Norsko': ['Olimb','Rosseli Olsen','Aas','Valkvae Olsen'],
  'Rakousko': ['Zwerger','Rohrer','Huber M.','Unterweger','Kickert','Wallner','Schneider'],
  'Maďarsko': ['Galló','Bartalis','Hári','Sebők','Sofron','Vay'],
  'Velká Británie': ['Kirk','Dowd','Betteridge','Bowns','Richardson'],
};

export function getHraci(domaci: string, hoste: string): string[] {
  const hraci1 = SOUPISKY[domaci] || [];
  const hraci2 = SOUPISKY[hoste] || [];
  return [...hraci1, ...hraci2].sort();
}
