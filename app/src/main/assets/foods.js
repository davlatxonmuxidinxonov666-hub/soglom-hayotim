// Sog'lom Hayot — taomlar bazasi.
// Format: id | kategoriya | kkal,oqsil,yog',uglevod (100 g uchun) | uz | ru | en | sinonimlar | o'lchovlar (birinchisi — standart) | belgilar
// Belgilar: h — sog'lom ovqatlanish rejasi uchun mos, w — suv hisobiga qo'shiladi.
// Qiymatlar o'rtacha: uyda tayyorlangan taomning kaloriyasi retsept va yog' miqdoriga qarab farq qiladi.
const FOOD_DATA = `
osh|uz|250,7,14,24|Osh (palov)|Плов|Plov (pilaf)|palov,plov,плов,плова,ош,палов,osh,oshi,toshkent oshi,samarqand oshi,to'y oshi,choyxona oshi,oshdan,oshni|tarelka:350,kosa:350,lagan:350|
makaron_osh|uz|200,7,9,23|Makaron palov|Макаронный плов (макарон палав)|Pasta plov|makaron palov,makaron osh,makaronli osh,makaron palav,макаронный плов,макарон палав,макарон плов,макарон-палав,pasta plov|tarelka:300|
shivit_osh|uz|190,6,8,23|Shivit oshi|Шивит оши (зелёный плов)|Shivit oshi (green plov)|shivit oshi,shivit osh,зеленый плов,шивит|tarelka:350|
mastava|uz|75,4,3,8|Mastava|Мастава|Mastava (rice soup)|mastava,мастава,маставу,mastava sho'rva|kosa:400|h
moshkichiri|uz|130,6,4,18|Moshkichiri|Мошкичири|Moshkichiri (mung bean rice)|moshkichiri,moshkichir,mashkichiri,mashkichir,moshkichri,мошкичири,мошкичир,машкичири,машкичир|tarelka:350|h
moshxorda|uz|65,3.5,2.5,7.5|Mosh xo'rda|Машхурда|Mosh xo'rda (mung bean soup)|moshxo'rda,mosh xo'rda,mashxurda,mashhurda,moshxurda,машхурда,мошхурда,мошхўрда|kosa:400|h
shurva|uz|60,4,3.5,3.5|Sho'rva|Шурпа|Shurpa (meat soup)|sho'rva,shorva,shurva,shurpa,шурпа,шорва,шўрва,sorpa,go'sht sho'rva,qaynatma,qaynatma sho'rva,суп,супа,супчик,sup,soup|kosa:450|h
lagmon|uz|140,7,5.5,16|Lag'mon|Лагман|Lagman (noodle soup)|lag'mon,lagmon,lagman,лагман,лагмон,uyg'ur lag'mon|kosa:450|
qovurma_lagmon|uz|200,8,9,22|Qovurma lag'mon|Жареный лагман|Fried lagman|qovurma lag'mon,qovurma lagman,жареный лагман,босо лагман,boso lagman,gyuro lagman|tarelka:350|
manti|uz|210,10,11,18|Manti|Манты|Manti (dumplings)|manti,manty,манты,манти,мантов|dona:55,tarelka:300|
chuchvara|uz|110,6,5,11|Chuchvara (sho'rvali)|Чучвара (с бульоном)|Chuchvara soup|chuchvara,чучвара,чучвару,chuchvara sho'rva|kosa:350|
qovurma_chuchvara|uz|250,10,13,24|Qovurma chuchvara|Жареная чучвара|Fried chuchvara|qovurma chuchvara,жареная чучвара|tarelka:250|
somsa|uz|320,11,19,27|Somsa (go'shtli)|Самса (с мясом)|Samsa (meat)|somsa,samsa,самса,самсы,самсу,сомса,tandir somsa,go'shtli somsa,самса с мясом|dona:130|
somsa_qovoq|uz|210,4,9,28|Qovoqli somsa|Самса с тыквой|Pumpkin samsa|qovoqli somsa,qovoq somsa,самса с тыквой,тыквенная самса|dona:120|
somsa_kartoshka|uz|240,5,11,30|Kartoshkali somsa|Самса с картошкой|Potato samsa|kartoshkali somsa,самса с картошкой,картофельная самса|dona:120|
kok_somsa|uz|220,5,10,27|Ko'k somsa|Самса с зеленью|Herb samsa|ko'k somsa,kok somsa,самса с зеленью,зеленая самса|dona:110|
dimlama|uz|95,6,5,7|Dimlama|Димлама|Dimlama (meat & veg stew)|dimlama,димлама,dimlyama,димляма|tarelka:400|h
qozon_kabob|uz|230,12,15,12|Qozon kabob|Казан-кабоб|Kazan kebab|qozon kabob,qozon kabobi,qovurdoq,казан кабоб,казан кебаб,kazan kabob|tarelka:300|
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
achchiq_chuchuk|salad|30,1,1.5,3.5|Achchiq-chuchuk|Ачичук|Achichuk (tomato-onion salad)|achchiq chuchuk,achchiq-chuchuk,achichuk,ачичук,achiq chuchuk,ачиқ чучук,ачик чучук,салат ачичук,salat achchiq chuchuk,achchiq chuchuk salat,аччик чучук,shakarob,шакароб|tarelka:200|h
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
oq_non|non|260,8,3,49|Oq non (baton)|Белый хлеб (батон)|White bread|baton,buxanka,батон,белый хлеб,хлеб,хлеба,white bread,oq non,toast,тост,тосты,tost|bolak:30|
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
tovuq_qovurilgan|meat|240,24,15,2|Qovurilgan tovuq|Жареная курица|Fried chicken|qovurilgan tovuq,жареная курица,fried chicken|bolak:150|
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

buxoro_osh|uz|230,7,12,24|Buxoro oshi|Бухарский плов|Bukhara plov|buxoro oshi,бухарский плов,devzira oshi|tarelka:350|
fargona_osh|uz|260,7,15,24|Farg'ona oshi|Ферганский плов|Fergana plov|farg'ona oshi,ферганский плов,qovurma osh|tarelka:350|
tovuq_osh|uz|200,9,9,21|Tovuqli osh|Плов с курицей|Chicken plov|tovuqli osh,плов с курицей,tovuq palov|tarelka:350|
shirguruch|uz|120,3,4,18|Shirguruch (sutli guruch)|Рисовая каша на молоке|Milk rice porridge|shirguruch,sutli guruch,рисовая каша,молочная рисовая каша|tarelka:250|
qovurma_shurva|uz|90,5,6,4|Qovurma sho'rva|Жареная шурпа|Fried shurpa|qovurma sho'rva,жареная шурпа|kosa:450|
tovuq_shurva|uz|45,4,2,3|Tovuq sho'rva|Куриный суп|Chicken soup|tovuq sho'rva,tovuq sho'rvasi,куриный суп,куриный бульон,chicken soup|kosa:450|h
kartoshka_shurva|uz|50,2,2,6|Kartoshkali sho'rva|Картофельный суп|Potato soup|kartoshkali sho'rva,картофельный суп,potato soup|kosa:400|h
xamir_shurva|uz|80,3.5,3,10|Xamir sho'rva (kesma)|Суп с лапшой (кесма)|Noodle soup|xamir sho'rva,kesma,кесма,лапша,суп с лапшой,ugra,угра,ugra osh|kosa:400|
unash|uz|75,3,3,9|Unash|Унаш|Unash (noodle soup)|unash,унаш|kosa:400|
shilpildoq|uz|85,4,3,11|Shilpildoq|Шилпилдок|Shilpildoq (dough soup)|shilpildoq,шилпилдок|kosa:400|
moshova|uz|70,4,2.5,8|Moshova|Мошова|Moshova (mung bean soup)|moshova,мошова|kosa:400|h
mampar|uz|130,6,5,15|Mampar|Мампар|Mampar (dough stew)|mampar,мампар|kosa:400|
dolma|uz|170,9,11,9|Do'lma|Долма|Dolma|do'lma,dolma,долма|dona:50|
karam_dolma|uz|120,7,7,8|Karam do'lma (golubsi)|Голубцы|Cabbage rolls|karam do'lma,голубцы,голубец,golubtsi|dona:120|
qalampir_dolma|uz|110,6,6,8|Qalampir do'lma|Фаршированный перец|Stuffed peppers|qalampir do'lma,фаршированный перец,перец фаршированный|dona:150|
tandir_kabob|uz|250,23,17,1|Tandir kabob|Тандыр кабоб|Tandoor kebab|tandir kabob,тандыр кабоб,тандыр кебаб|porsiya:200|
kuskovoy|uz|260,20,19,2|Kuskovoy kabob|Кусковой кебаб|Meat chunk kebab|kuskovoy,кусковой,кусковой кебаб|six:100|
baliq_shashlik|uz|160,20,8,0|Baliq shashlik|Шашлык из рыбы|Fish kebab|baliq shashlik,шашлык из рыбы,fish kebab|six:100|h
qanot|meat|230,19,16,2|Tovuq qanotchalari|Куриные крылышки|Chicken wings|qanot,qanotcha,qanotchalar,tovuq qanoti,куриные крылья,крылышки,крылья,wings|dona:40|
tovuq_son|meat|215,18,15,0|Tovuq soni|Куриная ножка (окорочок)|Chicken leg|tovuq soni,tovuq oyog'i,окорочок,окорочка,куриная ножка,chicken leg|dona:150|
tovuq_gril|meat|210,22,13,0|Tovuq gril|Курица гриль|Grilled chicken|tovuq gril,курица гриль,grill chicken,гриль|bolak:200|
yupqa|uz|250,9,12,27|Yupqa|Юпка|Yupqa (layered pie)|yupqa,юпка|bolak:150|
qutob|uz|250,8,12,28|Qutob|Кутаб|Qutab|qutob,кутаб,кутабы|dona:80|
bichak|uz|300,5,14,40|Bichak|Бичак|Bichak (pumpkin pastry)|bichak,бичак|dona:80|
bogirsoq|non|400,7,20,48|Bo'g'irsoq|Баурсак|Baursak|bo'g'irsoq,bogirsoq,баурсак,баурсаки,baursak|dona:15|
pishme|non|380,7,18,48|Pishme|Пишме|Pishme (fried pastry)|pishme,пишме|dona:30|
samarqand_non|non|290,9,3,56|Samarqand noni|Самаркандская лепёшка|Samarkand bread|samarqand noni,самаркандская лепешка,samarqand non|bolak:70,dona:500|
kulcha|non|330,8,9,54|Kulcha|Кулча|Kulcha (small bread)|kulcha,кулча|dona:100|
varaqi_somsa|uz|360,10,23,29|Varaqi somsa|Слоёная самса|Flaky samsa|varaqi somsa,varak somsa,слоеная самса|dona:110|
tovuq_somsa|uz|280,11,15,26|Tovuqli somsa|Самса с курицей|Chicken samsa|tovuqli somsa,самса с курицей|dona:120|
manti_qovoq|uz|140,4,5,20|Qovoqli manti|Манты с тыквой|Pumpkin manti|qovoqli manti,манты с тыквой|dona:50|
holvaytar|sweet|330,5,18,38|Holvaytar|Холвайтар|Holvaytar (flour halva)|holvaytar,xolvaytar,холвайтар|piyola:150|
parvarda|sweet|380,0,0,95|Parvarda|Парварда|Parvarda (pulled candy)|parvarda,парварда|dona:10|
chakki|dairy|70,6,2,4|Chakki|Чакка|Chakka (strained yogurt)|chakki,chakka,чакка|oshqoshiq:30|h
qimiz|drink|50,2,2,5|Qimiz|Кумыс|Kumis|qimiz,кумыс,kumis|stakan:250|
sutli_choy|drink|40,1.5,1.5,4.5|Sutli choy|Чай с молоком|Tea with milk|sutli choy,чай с молоком,ак чай|piyola:200|
bedana|meat|168,12,13,0.5|Bedana tuxumi|Перепелиные яйца|Quail eggs|bedana tuxumi,bedana,перепелиные яйца,quail eggs|dona:12|h

mosh|garnish|105,7,0.4,19|Mosh (qaynatilgan)|Маш (варёный)|Mung beans (boiled)|mosh,маш,mung|tarelka:200|h
loviya|garnish|125,8,0.5,22|Loviya (qaynatilgan)|Фасоль (варёная)|Beans (boiled)|loviya,фасоль,beans|tarelka:200|h
noxat|garnish|140,8,2.5,22|No'xat (qaynatilgan)|Нут (варёный)|Chickpeas (boiled)|no'xat,noxat,нут,горох,chickpeas|tarelka:200|h
yasmiq|garnish|115,9,0.4,20|Yasmiq (qaynatilgan)|Чечевица (варёная)|Lentils (boiled)|yasmiq,чечевица,lentils|tarelka:200|h
ovsyanka_suv|garnish|70,2.5,1.5,12|Suli bo'tqasi (suvda)|Овсянка на воде|Oatmeal (with water)|овсянка на воде,suvda suli,oatmeal with water|tarelka:250|h
tariq|garnish|110,3.5,1,21|Tariq bo'tqasi|Пшённая каша|Millet porridge|tariq bo'tqa,tariq,пшенка,пшенная каша,millet|tarelka:250|h
perlovka|garnish|110,3,0.5,23|Perlovka|Перловка|Pearl barley|perlovka,перловка,pearl barley|tarelka:200|h
bulgur|garnish|85,3,0.2,19|Bulgur|Булгур|Bulgur|bulgur,булгур|tarelka:200|h
kuskus|garnish|112,3.8,0.2,23|Kuskus|Кускус|Couscous|kuskus,кускус,couscous|tarelka:200|
pechka_kartoshka|garnish|120,2.5,4,19|Pechda pishgan kartoshka|Запечённый картофель|Baked potatoes|pechda kartoshka,запеченный картофель,картошка по деревенски,po derevenski,baked potatoes|tarelka:200|
granola|garnish|450,10,18,62|Granola / myusli|Гранола / мюсли|Granola / muesli|granola,мюсли,musli,muesli|porsiya:50|
xlopya|garnish|370,7,1,84|Makkajo'xori xlopyalari|Кукурузные хлопья|Cornflakes|xlopya,хлопья,кукурузные хлопья,cornflakes|porsiya:40|
vareniki|uz|200,5,5,33|Vareniki|Вареники|Vareniki (dumplings)|vareniki,вареники|tarelka:250,dona:30|
sirniki|non|220,15,10,18|Sirniki|Сырники|Syrniki (cottage cheese pancakes)|sirniki,сырники,syrniki|dona:50|
oladi|non|250,6,9,36|Oladi|Оладьи|Thick pancakes|oladi,оладьи,оладушки,fritters|dona:40|
cheburek|non|300,9,17,28|Cheburek|Чебурек|Cheburek|cheburek,чебурек,чебуреки|dona:130|
xachapuri|non|300,11,15,30|Xachapuri|Хачапури|Khachapuri|xachapuri,хачапури,khachapuri|bolak:150,dona:300|
sosiska_testo|fast|300,9,17,28|Xamirdagi sosiska|Сосиска в тесте|Sausage roll|сосиска в тесте,xamirdagi sosiska,sausage roll|dona:100|
pirojki_pech|non|260,8,8,40|Pishirilgan pirojki|Печёные пирожки|Baked pirozhki|печеные пирожки,pishirilgan pirojki,baked pirozhki|dona:70|
pirog|non|300,6,13,40|Pirog|Пирог|Pie|pirog,пирог,пирога,pie|bolak:100|
lavash_non|non|275,9,1,56|Yupqa lavash non|Тонкий лаваш|Thin lavash bread|lavash non,тонкий лаваш,армянский лаваш|dona:80|
kraker|non|430,10,14,68|Kraker|Крекер|Crackers|kraker,крекер,крекеры,crackers|dona:8|
suxarik|fast|400,10,12,63|Suxariklar|Сухарики|Croutons|suxarik,suxariklar,сухарики,сухари,croutons|paket:40|

toshkent_salat|salad|200,10,15,6|Toshkent salati|Салат «Ташкент»|Tashkent salad|toshkent salati,салат ташкент,ташкентский салат,tashkent salad|tarelka:200|
karam_salat|salad|50,1.5,3,5|Karam salati|Салат из капусты|Cabbage salad|karam salati,салат из капусты,капустный салат,coleslaw|tarelka:200|h
morkovcha|salad|120,1.2,9,8|Koreyscha sabzi|Морковь по-корейски|Korean carrot salad|koreyscha sabzi,морковь по корейски,морковча,morkovcha|tarelka:150|
lavlagi_salat|salad|110,1.5,8,8|Lavlagi salati|Свекольный салат|Beet salad|lavlagi salati,салат из свеклы,свекольный салат,beet salad|tarelka:150|
bodring_salat|salad|60,1,4.5,3.5|Bodring salati (smetanali)|Салат из огурцов со сметаной|Cucumber salad|bodring salati,огуречный салат,салат из огурцов|tarelka:150|h
mimoza|salad|220,7,19,4|Mimoza salati|Салат «Мимоза»|Mimosa salad|mimoza,мимоза|tarelka:200|
shuba|salad|190,6,15,8|Shuba salati|Сельдь под шубой|Herring under fur coat|seld pod shuboy,селедка под шубой,шуба|tarelka:200|
grek_salat|salad|100,3,8,4|Grek salati|Греческий салат|Greek salad|grek salati,греческий салат,greek salad|tarelka:200|h
sezar|salad|180,9,13,7|Sezar salati|Салат «Цезарь»|Caesar salad|sezar,цезарь,caesar|tarelka:200|
krab_salat|salad|200,6,16,9|Krab salati|Крабовый салат|Crab stick salad|krab salati,крабовый салат|tarelka:200|
karam|salad|25,1.3,0.1,6|Karam|Капуста|Cabbage|karam,капуста,cabbage|tarelka:150|h
dimlangan_karam|salad|75,2,4,8|Dimlangan karam|Тушёная капуста|Stewed cabbage|dimlangan karam,тушеная капуста,stewed cabbage|tarelka:200|h
gulkaram|salad|25,2,0.3,5|Gulkaram|Цветная капуста|Cauliflower|gulkaram,цветная капуста,cauliflower|tarelka:150|h
brokkoli|salad|34,2.8,0.4,7|Brokkoli|Брокколи|Broccoli|brokkoli,брокколи,broccoli|tarelka:150|h
baqlajon|salad|120,1,10,7|Qovurilgan baqlajon|Жареные баклажаны|Fried eggplant|baqlajon,qovurilgan baqlajon,баклажан,баклажаны,eggplant|tarelka:150|
qalampir|salad|27,1,0.3,6|Bulg'or qalampiri|Болгарский перец|Bell pepper|qalampir,bulg'or qalampiri,болгарский перец,перец,bell pepper|dona:150|h
piyoz|salad|40,1.1,0.1,9|Piyoz|Лук|Onion|piyoz,лук,onion|dona:80|h
lavlagi|salad|43,1.6,0.2,10|Lavlagi|Свёкла|Beetroot|lavlagi,свекла,beetroot,beet|dona:150|h
turp|salad|20,1,0.1,4|Turp / rediska|Редька / редиска|Radish|turp,rediska,редька,редиска,radish|dona:100|h
qovoq|salad|26,1,0.1,6.5|Qovoq|Тыква|Pumpkin|qovoq,тыква,pumpkin|bolak:150|h
kabachok|salad|24,1.2,0.3,4.6|Kabachok|Кабачок|Zucchini|kabachok,кабачок,кабачки,zucchini|tarelka:150|h
kabachok_ikra|salad|90,1.5,7,7|Kabachok ikrasi|Кабачковая икра|Squash spread|kabachok ikrasi,кабачковая икра|oshqoshiq:30|
makkajoxori|salad|96,3.4,1.5,21|Makkajo'xori|Кукуруза|Corn|makkajo'xori,makkajoxori,кукуруза,corn|dona:150|h
zamburug|salad|90,2.5,7,3|Qovurilgan zamburug'|Жареные грибы|Fried mushrooms|zamburug',qo'ziqorin,грибы,жареные грибы,mushrooms|tarelka:150|
kokat|salad|20,2,0.3,3|Ko'katlar|Зелень|Greens & herbs|ko'kat,ko'katlar,rayhon,ukrop,зелень,укроп,петрушка,кинза,greens,herbs|hovuch:20|h
zaytun|salad|145,1,15,4|Zaytun|Оливки / маслины|Olives|zaytun,оливки,маслины,olives|dona:4|
tuzlangan_bodring|salad|15,0.8,0.1,2|Tuzlangan bodring|Солёные огурцы|Pickles|tuzlangan bodring,соленые огурцы,маринованные огурцы,pickles|dona:60|h

behi|fruit|57,0.4,0.1,15|Behi|Айва|Quince|behi,айва,quince|dona:200|h
ananas|fruit|50,0.5,0.1,13|Ananas|Ананас|Pineapple|ananas,ананас,pineapple|bolak:100|h
mango|fruit|60,0.8,0.4,15|Mango|Манго|Mango|mango,манго|dona:200|h
avokado|fruit|160,2,15,9|Avokado|Авокадо|Avocado|avokado,авокадо,avocado|dona:150|h
greypfrut|fruit|42,0.8,0.1,11|Greypfrut|Грейпфрут|Grapefruit|greypfrut,грейпфрут,grapefruit|dona:250|h
malina|fruit|52,1.2,0.7,12|Malina|Малина|Raspberries|malina,малина,raspberries|piyola:120|h
smorodina|fruit|44,1,0.4,10|Smorodina|Смородина|Currants|smorodina,смородина,currants|piyola:120|h
chernika|fruit|57,0.7,0.3,14|Chernika|Черника / голубика|Blueberries|chernika,черника,голубика,blueberry,blueberries|piyola:120|h
tut|fruit|43,1.4,0.4,10|Tut|Шелковица (тут)|Mulberries|tut,тутовник,шелковица,mulberry,mulberries|piyola:150|h
jiyda|nuts|340,3,1,80|Jiyda|Джида|Oleaster (dried)|jiyda,джида|hovuch:30|

qiyma|meat|250,17,20,0|Qiyma (qovurilgan)|Фарш (жареный)|Minced meat|qiyma,фарш,minced meat|tarelka:150|
gulyash|meat|150,14,9,3|Gulyash|Гуляш|Goulash|gulyash,гуляш,goulash|tarelka:250|
befstroganov|meat|200,15,14,4|Befstroganov|Бефстроганов|Beef stroganoff|befstroganov,бефстроганов,stroganoff|tarelka:250|
tefteli|meat|180,11,11,9|Tefteli / frikadelka|Тефтели / фрикадельки|Meatballs|tefteli,тефтели,фрикадельки,frikadelka,meatballs|dona:40|
shnitsel|meat|270,17,17,12|Shnitsel / otbivnoy|Шницель / отбивная|Schnitzel / cutlet|shnitsel,шницель,отбивная,otbivnoy,schnitzel|dona:150|
tushonka|meat|220,15,17,0|Tushonka|Тушёнка|Canned stewed meat|tushonka,тушенка|porsiya:100,banka:325|
vetchina|meat|270,15,23,1|Vetchina|Ветчина|Ham|vetchina,ветчина,ham|bolak:20|
mol_tili|meat|230,16,18,0|Mol tili|Язык говяжий|Beef tongue|mol tili,говяжий язык|bolak:100|
ot_gosht|meat|175,20,10,0|Ot go'shti|Конина|Horse meat|ot go'shti,конина|bolak:100|
kurka|meat|150,24,6,0|Kurka go'shti|Индейка|Turkey|kurka,индейка,turkey|bolak:150|h
skumbriya|meat|190,18,13,0|Skumbriya|Скумбрия|Mackerel|skumbriya,скумбрия,mackerel|bolak:150|h
seld|meat|200,17,15,0|Seld (tuzlangan)|Сельдь, селёдка|Herring|seld,сельдь,селедка,herring|bolak:50|
tunets|meat|110,24,1,0|Tunets (konserva)|Тунец (консервы)|Canned tuna|tunets,тунец,tuna|porsiya:100|h
krevetka|meat|95,20,1.5,0|Krevetka|Креветки|Shrimp|krevetka,креветки,shrimp|porsiya:100|h
krab_tayoqcha|meat|90,6,1,15|Krab tayoqchalari|Крабовые палочки|Crab sticks|krab tayoqchalari,крабовые палочки,crab sticks|dona:20|

brynza|dairy|260,17,21,0|Brynza|Брынза|Feta cheese|brynza,брынза,feta|bolak:30|
mozzarella|dairy|280,22,21,2|Mozzarella|Моцарелла|Mozzarella|mozzarella,моцарелла|bolak:30|
eritilgan_pishloq|dairy|260,16,20,3|Eritilgan pishloq|Плавленый сыр|Processed cheese|eritilgan pishloq,плавленый сыр|dona:30|
syrok|sweet|400,8,25,35|Glazirlangan syrok|Глазированный сырок|Glazed curd snack|syrok,сырок,глазированный сырок|dona:45|
slivki|dairy|120,3,10,4|Slivki|Сливки|Cream|slivki,сливки,cream|oshqoshiq:15|
sgushenka|sweet|320,7,8,55|Quyultirilgan sut|Сгущёнка|Condensed milk|quyultirilgan sut,сгущенка,сгущенное молоко,condensed milk|choyqoshiq:12|
ryajenka|dairy|67,3,4,4|Ryajenka|Ряженка|Baked fermented milk|ryajenka,ряженка|stakan:250|h
kokteyl|drink|110,3,4,16|Sutli kokteyl|Молочный коктейль|Milkshake|sutli kokteyl,molochniy kokteyl,молочный коктейль,milkshake|stakan:300|
kakao|drink|80,3.5,3,10|Kakao (sutda)|Какао|Cocoa|kakao,какао,cocoa,горячий шоколад,hot chocolate|stakan:250|

medovik|sweet|430,5,20,58|Medovik|Медовик|Honey cake|medovik,медовик,honey cake|bolak:120|
napoleon|sweet|410,6,23,45|Napoleon torti|Торт «Наполеон»|Napoleon cake|napoleon,наполеон|bolak:120|
pahlava|sweet|430,6,25,47|Pahlava|Пахлава|Baklava|pahlava,paxlava,пахлава,baklava|bolak:50|
ponchik|sweet|350,6,18,42|Ponchik|Пончик|Donut|ponchik,пончик,пончики,donut,doughnut|dona:60|
keks|sweet|400,6,20,50|Keks / maffin|Кекс / маффин|Muffin|keks,кекс,маффин,muffin|dona:70|
rulet|sweet|380,5,16,54|Rulet|Рулет|Swiss roll|rulet,рулет|bolak:50|
zefir|sweet|330,1,0,80|Zefir|Зефир|Marshmallow|zefir,зефир,marshmallow|dona:35|
marmelad|sweet|320,0,0,80|Marmelad|Мармелад|Jelly candy|marmelad,мармелад,jelly|dona:10|
kozinaki|nuts|520,15,30,50|Kozinaki|Козинаки|Seed brittle|kozinaki,козинаки|bolak:30|
popkorn|fast|400,9,15,60|Popkorn|Попкорн|Popcorn|popkorn,попкорн,popcorn|porsiya:50|

mors|drink|40,0.1,0,10|Mors|Морс|Berry drink|mors,морс|stakan:250|
smuzi|drink|60,1,0.5,13|Smuzi|Смузи|Smoothie|smuzi,смузи,smoothie|stakan:300|h
protein|drink|110,20,2,4|Protein kokteyli|Протеиновый коктейль|Protein shake|protein,протеин,протеиновый коктейль,protein shake|stakan:300|
muzli_choy|drink|30,0,0,7.5|Muzli choy (shirin)|Холодный чай|Iced tea|ice tea,холодный чай,lipton,iced tea|butilka:500|
vino|drink|85,0,0,2.5|Vino|Вино|Wine|vino,вино,wine|stakan:150|
shampan|drink|85,0,0,3|Shampan|Шампанское|Champagne|shampan,шампанское,champagne|stakan:150|
aroq|drink|235,0,0,0|Aroq|Водка|Vodka|aroq,водка,vodka|porsiya:50|
konyak|drink|240,0,0,0|Konyak|Коньяк|Brandy|konyak,коньяк,brandy,cognac|porsiya:50|

sushi|fast|150,6,3,25|Sushi / roll|Суши / роллы|Sushi rolls|sushi,суши,roll,ролл,роллы,rolls|dona:30|
sendvich|fast|250,11,10,28|Sendvich / buterbrod|Сэндвич / бутерброд|Sandwich|sendvich,сэндвич,бутерброд,buterbrod,sandwich|dona:150|
donar_tarelka|fast|200,12,10,16|Donar (tarelkada)|Донер на тарелке|Doner plate|donar tarelka,донер на тарелке,doner plate|tarelka:400|

soya_sous|other|50,6,0,6|Soya sousi|Соевый соус|Soy sauce|soya sousi,соевый соус,soy sauce|oshqoshiq:15|
gorchitsa|other|140,7,9,6|Gorchitsa|Горчица|Mustard|gorchitsa,горчица,mustard|choyqoshiq:5|
zaytun_yogi|other|900,0,100,0|Zaytun yog'i|Оливковое масло|Olive oil|zaytun yog'i,оливковое масло,olive oil|oshqoshiq:15|
xumus|other|170,8,10,14|Xumus|Хумус|Hummus|xumus,хумус,hummus|oshqoshiq:30|h
arahis_pasta|other|600,25,50,20|Yeryong'oq pastasi|Арахисовая паста|Peanut butter|yeryong'oq pastasi,арахисовая паста,peanut butter|oshqoshiq:20|
shokolad_pasta|sweet|540,6,31,57|Shokoladli pasta|Шоколадная паста|Chocolate spread|nutella,нутелла,шоколадная паста,chocolate spread|oshqoshiq:20|
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
