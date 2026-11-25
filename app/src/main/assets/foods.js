// Sog'lom Hayot — taomlar bazasi.
// Format: id | kategoriya | kkal,oqsil,yog',uglevod (100 g uchun) | uz | ru | en | sinonimlar | o'lchovlar (birinchisi — standart) | belgilar
// Belgilar: h — sog'lom ovqatlanish rejasi uchun mos, w — suv hisobiga qo'shiladi.
// Qiymatlar o'rtacha: uyda tayyorlangan taomning kaloriyasi retsept va yog' miqdoriga qarab farq qiladi.
const FOOD_DATA = `
osh|uz|250,7,14,24|Osh (palov)|Плов|Plov (pilaf)|palov,plov,плов,плова,ош,палов,osh,oshi,toshkent oshi,samarqand oshi,to'y oshi,choyxona oshi,oshdan,oshni|tarelka:350,kosa:350,lagan:350|
shivit_osh|uz|190,6,8,23|Shivit oshi|Шивит оши (зелёный плов)|Shivit oshi (green plov)|shivit oshi,shivit osh,зеленый плов,шивит|tarelka:350|
mastava|uz|75,4,3,8|Mastava|Мастава|Mastava (rice soup)|mastava,мастава,маставу,mastava sho'rva|kosa:400|h
moshkichiri|uz|130,6,4,18|Moshkichiri|Мошкичири|Moshkichiri (mung bean rice)|moshkichiri,moshkichir,mashkichiri,mashkichir,moshkichri,мошкичири,мошкичир,машкичири,машкичир|tarelka:350|h
moshxorda|uz|65,3.5,2.5,7.5|Mosh xo'rda|Машхурда|Mosh xo'rda (mung bean soup)|moshxo'rda,mosh xo'rda,mashxurda,mashhurda,moshxurda,машхурда,мошхурда,мошхўрда|kosa:400|h
shurva|uz|60,4,3.5,3.5|Sho'rva|Шурпа|Shurpa (meat soup)|sho'rva,shorva,shurva,shurpa,шурпа,шорва,шўрва,sorpa,go'sht sho'rva|kosa:450|h
lagmon|uz|140,7,5.5,16|Lag'mon|Лагман|Lagman (noodle soup)|lag'mon,lagmon,lagman,лагман,лагмон|kosa:450|
qovurma_lagmon|uz|200,8,9,22|Qovurma lag'mon|Жареный лагман|Fried lagman|qovurma lag'mon,qovurma lagman,жареный лагман,босо лагман,boso lagman,gyuro lagman|tarelka:350|
manti|uz|210,10,11,18|Manti|Манты|Manti (dumplings)|manti,manty,манты,манти,мантов|dona:55,tarelka:300|
chuchvara|uz|110,6,5,11|Chuchvara (sho'rvali)|Чучвара (с бульоном)|Chuchvara soup|chuchvara,чучвара,чучвару,chuchvara sho'rva|kosa:350|
qovurma_chuchvara|uz|250,10,13,24|Qovurma chuchvara|Жареная чучвара|Fried chuchvara|qovurma chuchvara,жареная чучвара|tarelka:250|
somsa|uz|320,11,19,27|Somsa (go'shtli)|Самса (с мясом)|Samsa (meat)|somsa,samsa,самса,самсы,самсу,сомса,tandir somsa,go'shtli somsa,самса с мясом|dona:130|
somsa_qovoq|uz|210,4,9,28|Qovoqli somsa|Самса с тыквой|Pumpkin samsa|qovoqli somsa,qovoq somsa,самса с тыквой,тыквенная самса|dona:120|
somsa_kartoshka|uz|240,5,11,30|Kartoshkali somsa|Самса с картошкой|Potato samsa|kartoshkali somsa,самса с картошкой,картофельная самса|dona:120|
kok_somsa|uz|220,5,10,27|Ko'k somsa|Самса с зеленью|Herb samsa|ko'k somsa,kok somsa,самса с зеленью,зеленая самса|dona:110|
dimlama|uz|95,6,5,7|Dimlama|Димлама|Dimlama (meat & veg stew)|dimlama,димлама,dimlyama,димляма|tarelka:400|h
qozon_kabob|uz|230,12,15,12|Qozon kabob|Казан-кабоб|Kazan kebab|qozon kabob,qozon kabobi,казан кабоб,казан кебаб,kazan kabob|tarelka:300|
norin|uz|200,12,9,17|Norin|Нарын|Naryn|norin,naryn,нарын,норин,бешбармак,beshbarmoq|tarelka:300|
halim|uz|120,8,5,11|Halim|Халим|Halim (wheat & meat porridge)|halim,xalim,халим|kosa:350|
hasip|uz|290,11,25,4|Hasip|Хасип|Hasip (sausage)|hasip,xasip,хасип|bolak:100|
tandir_gosht|uz|260,25,17,0|Tandir go'sht|Тандыр гушт|Tandoor lamb|tandir go'sht,tandir gosht,тандыр гушт,тандыр мясо|porsiya:200|
jiz|uz|320,18,27,2|Jiz (qovurma go'sht)|Жиз (жареное мясо)|Jiz (fried meat)|jiz,жиз,qovurma go'sht,жареное мясо,жаркое|tarelka:250|
shashlik_qoy|uz|280,20,22,0|Shashlik (qo'y go'shti)|Шашлык из баранины|Lamb shashlik|shashlik,шашлык,шашлыка,qo'y shashlik,шашлык из баранины,kabob,кабоб,кебаб,kebab|six:90|
shashlik_mol|uz|220,24,13,0|Shashlik (mol go'shti)|Шашлык из говядины|Beef shashlik|mol shashlik,mol go'shti shashlik,шашлык из говядины,beef shashlik|six:90|
shashlik_jigar|uz|190,18,11,4|Jigar shashlik|Шашлык из печени|Liver shashlik|jigar shashlik,jigar kabob,шашлык из печени,печень шашлык|six:80|
lula|uz|270,16,22,2|Lula kabob|Люля-кебаб|Lula kebab|lula kabob,lula,люля,люля кебаб,lyulya|six:100|
tovuq_shashlik|uz|165,24,7,1|Tovuq shashlik|Куриный шашлык|Chicken shashlik|tovuq shashlik,куриный шашлык,шашлык из курицы,chicken shashlik|six:100|h
tuxum_barak|uz|190,8,10,17|Tuxum barak|Тухум барак|Tukhum barak (egg dumplings)|tuxum barak,barak,тухум барак,барак|tarelka:250|
qatlama|uz|380,7,22,40|Qatlama|Катлама|Katlama (layered flatbread)|qatlama,катлама,katlama|dona:100|
sumalak|uz|230,4,1,52|Sumalak|Сумаляк|Sumalak|sumalak,сумаляк,сумалак|piyola:150|
achchiq_chuchuk|salad|30,1,1.5,3.5|Achchiq-chuchuk|Ачичук|Achichuk (tomato-onion salad)|achchiq chuchuk,achchiq-chuchuk,achichuk,ачичук,салат ачичук,salat achchiq chuchuk,achchiq chuchuk salat,аччик чучук,shakarob,шакароб|tarelka:200|h
qurt|dairy|290,32,15,6|Qurt|Курт|Kurt (dried cheese balls)|qurt,kurt,курт|dona:10|
chalob|uz|25,1.5,1.2,2|Chalob|Чалоп|Chalop (cold yogurt soup)|chalob,chalop,чалоп,чалоб|kosa:350|h
gumma|non|300,8,15,33|Gumma (pirojki)|Пирожки (гумма)|Fried pirozhki|gumma,гумма,pirojki,пирожки,пирожок,пирожка|dona:80|
belyash|non|330,11,19,29|Belyash|Беляш|Belyash|belyash,беляш,беляши|dona:100|
xonim|uz|220,9,10,24|Xonim|Ханум|Khanum (steamed roll)|xonim,hanum,xanum,honim,ханум|bolak:150|
nisholda|sweet|260,3,0,63|Nisholda|Нишалда|Nishalda (whipped sweet)|nisholda,нишалда,nishalda|oshqoshiq:30|
chakchak|sweet|450,7,18,64|Chak-chak|Чак-чак|Chak-chak|chak-chak,chakchak,чак чак,чак-чак|bolak:50|
holva|sweet|520,12,30,52|Holva|Халва|Halva|holva,halva,xolva,халва,pashmak,пашмак|bolak:50|
navvot|sweet|390,0,0,98|Navvot|Нават|Navat (crystal sugar)|navvot,navat,нават,наввот|dona:10|

non|non|260,8.5,1.5,52|Non (obi non)|Лепёшка|Uzbek flatbread|non,obi non,tandir non,лепешка,лепешки,лепёшка,lepeshka,bread,flatbread|bolak:60,dona:300|
patir|non|330,8,11,50|Patir non|Патыр|Patir (rich flatbread)|patir,патыр,патир|bolak:60,dona:300|
qora_non|non|210,7,1.3,41|Qora non|Чёрный хлеб|Rye bread|qora non,черный хлеб,черного хлеба,бородинский,rye bread|bolak:30|h
oq_non|non|260,8,3,49|Oq non (baton)|Белый хлеб (батон)|White bread|baton,buxanka,батон,белый хлеб,хлеб,хлеба,white bread,oq non|bolak:30|
makaron|garnish|140,5,1,28|Makaron (qaynatilgan)|Макароны (варёные)|Pasta (boiled)|makaron,makaronlar,макароны,макарон,spagetti,спагетти,pasta|tarelka:250|
grechka|garnish|110,4,1,21|Grechka|Гречка|Buckwheat|grechka,гречка,гречки,гречневая каша,buckwheat,marjumak|tarelka:200|h
guruch|garnish|130,2.7,0.3,28|Guruch (qaynatilgan)|Рис (варёный)|Rice (boiled)|guruch,рис,риса,rice|tarelka:200|h
ovsyanka|garnish|100,3.5,2.5,15|Suli bo'tqasi (sutda)|Овсянка на молоке|Oatmeal (with milk)|ovsyanka,овсянка,овсянки,овсяная каша,геркулес,suli bo'tqa,suli,oatmeal,oats|tarelka:250|h
manniy|garnish|100,3,3,16|Manniy bo'tqa|Манная каша|Semolina porridge|manniy,manniy bo'tqa,манная каша,манка,манки,semolina|tarelka:250|
kartoshka_pyure|garnish|90,2,3.5,14|Kartoshka pyuresi|Картофельное пюре|Mashed potatoes|pyure,kartoshka pyure,пюре,картофельное пюре,mashed potato|tarelka:250|
kartoshka_qovurilgan|garnish|190,3,10,23|Qovurilgan kartoshka|Жареная картошка|Fried potatoes|qovurilgan kartoshka,kartoshka qovurma,жареная картошка,жареный картофель,fried potatoes|tarelka:250|
kartoshka|garnish|86,2,0.1,20|Qaynatilgan kartoshka|Варёный картофель|Boiled potatoes|kartoshka,картошка,картофель,варёная картошка,potato,potatoes|tarelka:250,dona:100|h
pelmen|uz|250,11,12,25|Pelmen|Пельмени|Pelmeni|pelmen,пельмени,пельменей,pelmeni|tarelka:250,dona:12|
blin|non|230,6,9,31|Blinchik (quymoq)|Блины|Pancakes|blin,blinchik,блины,блин,блинчики,блинчик,quymoq,pancake,pancakes|dona:50|
bulochka|non|330,8,10,52|Bulochka|Булочка|Bun|bulochka,bulka,булочка,булочки,булка,bun|dona:80|
pechenye|sweet|450,6,17,68|Pechenye|Печенье|Cookies|pechenye,печенье,печенья,cookie,cookies,biscuit|dona:12|
tort|sweet|380,5,20,46|Tort|Торт|Cake|tort,торт,торта,cake|bolak:120|
pirojnoe|sweet|400,5,22,46|Pirojnoe|Пирожное|Pastry|pirojnoe,пирожное,пирожные,pastry|dona:80|

mol_gosht|meat|250,26,16,0|Mol go'shti (qaynatilgan)|Говядина (варёная)|Beef (boiled)|mol go'shti,mol go'sht,говядина,говядины,beef,go'sht,gosht,мясо,meat|bolak:100|h
qoy_gosht|meat|290,24,21,0|Qo'y go'shti|Баранина|Lamb|qo'y go'shti,qo'y go'sht,баранина,баранины,lamb,mutton|bolak:100|
tovuq|meat|170,25,7,0|Tovuq (qaynatilgan)|Курица (варёная)|Chicken (boiled)|tovuq,tovuq go'shti,tovuq ko'ksi,курица,курицы,куриная грудка,грудка,chicken,chicken breast|bolak:150|h
tovuq_qovurilgan|meat|240,24,15,2|Qovurilgan tovuq|Жареная курица|Fried chicken|qovurilgan tovuq,жареная курица,fried chicken,крылышки,окорочка|bolak:150|
baliq|meat|140,20,6,0|Baliq (pishirilgan)|Рыба (запечённая)|Fish (baked)|baliq,рыба,рыбы,fish|bolak:150|h
baliq_qovurilgan|meat|200,19,12,4|Qovurilgan baliq|Жареная рыба|Fried fish|qovurilgan baliq,жареная рыба,fried fish|bolak:150|
tuxum|meat|155,13,11,1|Tuxum (qaynatilgan)|Яйцо (варёное)|Egg (boiled)|tuxum,qaynatilgan tuxum,яйцо,яйца,яиц,яичко,egg,eggs|dona:55|h
quymoq_tuxum|meat|196,13.5,15,1|Qovurilgan tuxum / omlet|Яичница / омлет|Fried eggs / omelette|qovurilgan tuxum,omlet,яичница,яичницу,омлет,omelette,fried eggs|tarelka:150|
kolbasa|meat|300,12,27,2|Kolbasa|Колбаса|Sausage (sliced)|kolbasa,kalbasa,колбаса,колбасы,sausage,salami|bolak:15|
sosiska|meat|260,11,23,2|Sosiska|Сосиски|Frankfurter|sosiska,sosiskalar,сосиска,сосиски,сарделька|dona:50|
qazi|meat|450,15,43,0|Qazi|Казы|Kazy (horse sausage)|qazi,kazi,казы|bolak:20|
kotlet|meat|250,15,17,9|Kotlet|Котлета|Cutlet|kotlet,kotleta,котлета,котлеты,котлет,cutlet,patty|dona:80|
jigar|meat|200,20,11,4|Jigar qovurma|Жареная печень|Fried liver|jigar,jigar qovurma,печень,печенка,liver|tarelka:150|

sut|dairy|52,3,2.5,4.7|Sut|Молоко|Milk|sut,молоко,молока,milk|stakan:250|h
qatiq|dairy|60,3,3.2,4|Qatiq|Катык|Katyk (plain yogurt)|qatiq,katik,katyk,катык|stakan:200|h
yogurt|dairy|85,3.5,2.5,12|Yogurt (mevali)|Йогурт (фруктовый)|Fruit yogurt|yogurt,йогурт,йогурта|stakan:150|
kefir|dairy|53,3,2.5,4|Kefir|Кефир|Kefir|kefir,кефир,кефира|stakan:250|h
ayron|dairy|30,1.7,1.5,2.4|Ayron|Айран|Ayran|ayron,айран,airan,ayran,tan|stakan:250|h
suzma|dairy|120,10,6,4|Suzma|Сузьма|Suzma (strained yogurt)|suzma,сузьма,сузма,suzme|oshqoshiq:30|h
tvorog|dairy|120,17,5,2|Tvorog (5%)|Творог (5%)|Cottage cheese|tvorog,творог,творога,cottage cheese|porsiya:150|h
pishloq|dairy|350,24,28,0|Pishloq|Сыр|Cheese|pishloq,сыр,сыра,cheese|bolak:20|
smetana|dairy|200,2.7,20,3|Smetana|Сметана|Sour cream|smetana,сметана,сметаны,sour cream|oshqoshiq:20|
qaymoq|dairy|380,2.5,40,3|Qaymoq|Каймак|Kaymak (clotted cream)|qaymoq,каймак,kaymak|oshqoshiq:20|
saryog|dairy|740,0.5,82,0.8|Saryog'|Сливочное масло|Butter|saryog',saryog,сливочное масло,butter|choyqoshiq:7|
muzqaymoq|sweet|210,3.5,11,24|Muzqaymoq|Мороженое|Ice cream|muzqaymoq,мороженое,мороженого,пломбир,ice cream|dona:80|

salat|salad|60,1,4.5,4|Sabzavotli salat (yog'li)|Овощной салат (с маслом)|Vegetable salad|salat,sabzavot salati,bodring pomidor salati,салат,салата,овощной салат,vegetable salad,salad|tarelka:200|h
olivye|salad|190,5,16,7|Olivye|Оливье|Olivier salad|olivye,olive,оливье|tarelka:200|
vinegret|salad|80,1.5,4.5,9|Vinegret|Винегрет|Vinegret (beet salad)|vinegret,винегрет|tarelka:200|h
pomidor|salad|18,0.9,0.2,3.9|Pomidor|Помидор|Tomato|pomidor,pomidorlar,помидор,помидоры,помидора,томат,tomato,tomatoes|dona:120|h
bodring|salad|15,0.7,0.1,3.6|Bodring|Огурец|Cucumber|bodring,bodringlar,огурец,огурцы,огурца,cucumber|dona:100|h
sabzi|salad|41,0.9,0.2,10|Sabzi|Морковь|Carrot|sabzi,морковь,морковка,carrot|dona:80|h
borsh|uz|50,2.5,2.5,5|Borsh|Борщ|Borscht|borsh,борщ,борща,borscht|kosa:400|h

olma|fruit|52,0.3,0.2,14|Olma|Яблоко|Apple|olma,olmalar,яблоко,яблоки,яблока,apple,apples|dona:180|h
banan|fruit|89,1.1,0.3,23|Banan|Банан|Banana|banan,банан,бананы,банана,banana|dona:120|h
uzum|fruit|70,0.7,0.2,18|Uzum|Виноград|Grapes|uzum,виноград,винограда,grapes|tarelka:200|h
nok|fruit|57,0.4,0.1,15|Nok|Груша|Pear|nok,груша,груши,pear|dona:170|h
anor|fruit|72,1.7,1.2,17|Anor|Гранат|Pomegranate|anor,гранат,граната,pomegranate|dona:150|h
shaftoli|fruit|45,0.9,0.3,11|Shaftoli|Персик|Peach|shaftoli,персик,персики,peach|dona:150|h
orik|fruit|44,1.4,0.4,11|O'rik|Абрикос|Apricot|o'rik,orik,абрикос,абрикосы,урюк,apricot|dona:40|h
gilos|fruit|52,1,0.3,12|Gilos / olcha|Черешня / вишня|Cherries|gilos,olcha,черешня,вишня,cherry,cherries|piyola:150|h
qulupnay|fruit|33,0.7,0.3,8|Qulupnay|Клубника|Strawberries|qulupnay,клубника,клубники,strawberry,strawberries|piyola:150|h
xurmo|fruit|66,0.5,0.4,17|Xurmo|Хурма|Persimmon|xurmo,хурма,хурмы,persimmon|dona:200|h
apelsin|fruit|47,0.9,0.1,12|Apelsin|Апельсин|Orange|apelsin,апельсин,апельсины,orange|dona:180|h
mandarin|fruit|53,0.8,0.3,13|Mandarin|Мандарин|Tangerine|mandarin,мандарин,мандарины,tangerine|dona:80|h
limon|fruit|29,1.1,0.3,9|Limon|Лимон|Lemon|limon,лимон,lemon|bolak:10|h
qovun|fruit|35,0.8,0.2,8|Qovun|Дыня|Melon|qovun,дыня,дыни,melon|bolak:250|h
tarvuz|fruit|30,0.6,0.2,8|Tarvuz|Арбуз|Watermelon|tarvuz,арбуз,арбуза,watermelon|bolak:300|h
anjir|fruit|74,0.8,0.3,19|Anjir|Инжир|Fig|anjir,инжир,fig,figs|dona:50|h
kivi|fruit|61,1.1,0.5,15|Kivi|Киви|Kiwi|kivi,киви,kiwi|dona:75|h
olxori|fruit|46,0.7,0.3,11|Olxo'ri|Слива|Plum|olxo'ri,olxori,слива,сливы,plum,plums|dona:30|h

yongoq|nuts|654,15,65,14|Yong'oq|Грецкий орех|Walnuts|yong'oq,yongoq,грецкий орех,грецкие орехи,орехи,орех,walnut,walnuts|hovuch:30|h
bodom|nuts|580,21,50,22|Bodom|Миндаль|Almonds|bodom,миндаль,almond,almonds|hovuch:30|h
pista|nuts|560,20,45,28|Pista|Фисташки|Pistachios|pista,фисташки,фисташек,pistachio,pistachios|hovuch:30|
yeryongoq|nuts|567,26,49,16|Yeryong'oq|Арахис|Peanuts|yeryong'oq,yeryongoq,арахис,peanut,peanuts|hovuch:30|
semechka|nuts|580,21,51,20|Kungaboqar pistasi|Семечки|Sunflower seeds|semechka,семечки,семечек,kungaboqar,sunflower seeds|hovuch:30|
mayiz|nuts|300,3,0.5,79|Mayiz|Изюм|Raisins|mayiz,изюм,raisins|hovuch:30|
turshak|nuts|240,3.4,0.5,63|Turshak (quritilgan o'rik)|Курага|Dried apricots|turshak,курага,кураги,dried apricots|hovuch:30|
finik|nuts|280,2.5,0.4,75|Quritilgan xurmo|Финики|Dates|finik,финики,фиников,dates,quruq xurmo|dona:8|

shakar|sweet|400,0,0,100|Shakar|Сахар|Sugar|shakar,qand,сахар,сахара,sugar|choyqoshiq:5|
asal|sweet|320,0.3,0,82|Asal|Мёд|Honey|asal,мед,мёд,меда,honey|choyqoshiq:8|
murabbo|sweet|260,0.3,0,68|Murabbo|Варенье|Jam|murabbo,варенье,джем,jam|choyqoshiq:10|
shokolad|sweet|540,6,32,57|Shokolad|Шоколад|Chocolate|shokolad,шоколад,шоколада,chocolate|bolak:25|
konfet|sweet|450,3,18,70|Konfet|Конфета|Candy|konfet,конфета,конфеты,конфет,candy,sweets|dona:12|
snikers|sweet|490,8,24,60|Shokoladli batonchik|Шоколадный батончик|Chocolate bar|snikers,сникерс,марс,баунти,twix,твикс,батончик,chocolate bar|dona:50|
vafli|sweet|530,5,30,60|Vafli|Вафли|Wafers|vafli,вафли,вафля,wafers|dona:20|

kok_choy|drink|1,0,0,0.2|Ko'k choy (shakarsiz)|Зелёный чай (без сахара)|Green tea (no sugar)|ko'k choy,kok choy,choy,зеленый чай,зелёный чай,чай,green tea,tea|piyola:150|h
qora_choy|drink|1,0,0,0.3|Qora choy (shakarsiz)|Чёрный чай (без сахара)|Black tea (no sugar)|qora choy,черный чай,чёрный чай,black tea|piyola:150|h
kofe|drink|2,0.1,0,0|Qora kofe|Чёрный кофе|Black coffee|kofe,qora kofe,кофе,черный кофе,coffee,americano,американо,espresso,эспрессо|stakan:200|h
kofe_sut|drink|45,2.5,2,4.5|Kapuchino / latte|Капучино / латте|Cappuccino / latte|kapuchino,latte,капучино,латте,cappuccino,кофе с молоком|stakan:250|
kofe3v1|drink|420,3,13,73|Kofe 3 in 1|Кофе 3 в 1|Coffee 3-in-1|3 v 1,3v1,3 в 1,3 in 1,кофе 3 в 1,three in one,maccoffee,маккофе|paket:18|
kola|drink|42,0,0,10.6|Kola / gazli ichimlik|Кола / газировка|Cola / soda|kola,coca cola,cola,pepsi,fanta,sprite,кола,кока кола,пепси,фанта,спрайт,газировка,лимонад,soda,gazli suv|stakan:250,butilka:500,banka:330|
sharbat|drink|46,0.5,0.1,11|Sharbat (meva sharbati)|Сок|Juice|sharbat,сок,сока,juice|stakan:250|
kompot|drink|50,0.2,0,12.5|Kompot|Компот|Kompot|kompot,компот,компота|stakan:250|
kvas|drink|27,0.2,0,5.2|Kvas|Квас|Kvass|kvas,квас|stakan:250|
pivo|drink|43,0.5,0,3.6|Pivo|Пиво|Beer|pivo,пиво,пива,beer|butilka:500|
energetik|drink|45,0,0,11|Energetik|Энергетик|Energy drink|energetik,энергетик,red bull,ред булл,flash,флеш,adrenalin,адреналин,energy drink|banka:250|
suv|drink|0,0,0,0|Suv|Вода|Water|suv,вода,воды,воду,water,mineral suv,минералка|stakan:250,butilka:500|hw

lavash|fast|230,10,11,23|Lavash (shaurma)|Лаваш (шаурма)|Shawarma wrap|lavash,лаваш,шаурма,шаверма,doner,донер,shaurma,shawarma|dona:350|
burger|fast|250,12,12,24|Burger|Бургер|Burger|burger,gamburger,чизбургер,бургер,гамбургер,cheeseburger,hamburger|dona:220|
hotdog|fast|260,9,15,23|Hot-dog|Хот-дог|Hot dog|hot dog,hot-dog,hotdog,хот дог,хот-дог,хотдог|dona:180|
pitsa|fast|260,11,10,31|Pitsa|Пицца|Pizza|pitsa,pizza,пицца,пиццы|bolak:110|
fri|fast|310,3.5,15,41|Kartoshka fri|Картофель фри|French fries|fri,kartoshka fri,картошка фри,картофель фри,фри,french fries,fries|porsiya:120|
chips|fast|540,6,34,53|Chips|Чипсы|Chips|chips,чипсы,чипсов,crisps|paket:70|
nagets|fast|290,15,18,17|Naggets|Наггетсы|Nuggets|naggets,nagets,наггетсы,nuggets|dona:18|

yog|other|900,0,100,0|O'simlik yog'i|Растительное масло|Vegetable oil|yog',o'simlik yog'i,paxta yog'i,растительное масло,подсолнечное масло,масло,oil,vegetable oil|oshqoshiq:15|
mayonez|other|630,1,67,4|Mayonez|Майонез|Mayonnaise|mayonez,майонез,майонеза,mayonnaise|oshqoshiq:15|
ketchup|other|100,1.5,0.2,23|Ketchup|Кетчуп|Ketchup|ketchup,кетчуп|oshqoshiq:15|
`;

// Ovqatlanish rejasi andozalari (2000 kkal atrofida). Grammlar maqsadga qarab o'zgartiriladi.
const PLAN_TEMPLATES = {
  breakfast: [
    [['ovsyanka',250],['tuxum',55],['kok_choy',150]],
    [['tvorog',150],['asal',8],['olma',180],['qora_choy',150]],
    [['quymoq_tuxum',150],['qora_non',30],['pomidor',120],['bodring',100],['kok_choy',150]],
    [['qatiq',200],['non',40],['yongoq',20],['banan',120]],
    [['grechka',150],['sut',250],['tuxum',55]],
  ],
  lunch: [
    [['mastava',400],['achchiq_chuchuk',200],['qora_non',30]],
    [['osh',250],['achchiq_chuchuk',250]],
    [['moshkichiri',300],['salat',150]],
    [['shurva',450],['non',40]],
    [['grechka',200],['tovuq',150],['salat',200]],
    [['lagmon',400],['pomidor',120]],
    [['moshxorda',400],['qora_non',30],['bodring',100]],
  ],
  dinner: [
    [['tovuq_shashlik',150],['salat',200]],
    [['dimlama',400]],
    [['baliq',150],['guruch',150],['salat',150]],
    [['shashlik_mol',180],['achchiq_chuchuk',200]],
    [['chalob',350],['tuxum',55],['qora_non',30]],
    [['tovuq',150],['kartoshka',200],['vinegret',150]],
  ],
  snack: [
    [['olma',180]],
    [['qatiq',200]],
    [['yongoq',25]],
    [['kefir',250]],
    [['banan',120]],
    [['anor',150]],
    [['tvorog',100],['olma',100]],
    [['bodom',25]],
  ],
};
