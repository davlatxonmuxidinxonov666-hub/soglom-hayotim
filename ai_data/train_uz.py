# O'zbek taomlarini tanish uchun kichik model (MobileNetV3, Apache 2.0).
# GitHub Actions'da ishlaydi: ai_data/generated.txt dagi rasmlarni yuklab oladi,
# "boshqa ovqat" sinfi uchun ISSAI bazasidan rasmlar oladi va TFLite fayl chiqaradi.
import glob
import os
import random
import sys
import urllib.request

import numpy as np
import tensorflow as tf

OUT = sys.argv[1]            # app/src/main/assets/ai
CAFSD = sys.argv[2]          # ISSAI bazasi ochilgan papka (bo'sh bo'lishi mumkin)
LOG = sys.argv[3]
IMG = 224
random.seed(7)
tf.random.set_seed(7)
log = open(LOG, 'w')


def say(*a):
    s = ' '.join(str(x) for x in a)
    print(s)
    log.write(s + '\n')
    log.flush()


# 1) Yaratilgan rasmlar
items = [l.strip().split('|', 1) for l in open(os.environ.get('GEN', 'ai_data/generated.txt'), encoding='utf-8') if '|' in l]
paths, labels = [], []
for i, (cls, url) in enumerate(items):
    d = f'/tmp/uzdata/{cls}'
    os.makedirs(d, exist_ok=True)
    p = f'{d}/{i}.jpg'
    if not os.path.exists(p):
        try:
            urllib.request.urlretrieve(url, p)
        except Exception as e:
            say('yuklab bo\'lmadi', url, e)
            continue
    paths.append(p)
    labels.append(cls)
classes = sorted(set(labels))
say('yaratilgan rasmlar:', len(paths), {c: labels.count(c) for c in classes})

# 2) "Boshqa ovqat" — ISSAI bazasidan (chuchvaraga o'xshash tushpara sinflari chiqarib tashlanadi)
z = None
if CAFSD.startswith('http'):
    # Butun arxivni emas, faqat kerakli rasmlarni yuklab olish (HTTP Range)
    try:
        from remotezip import RemoteZip
        z = RemoteZip(CAFSD, timeout=60)
    except Exception as e:
        say('ISSAI arxiviga ulanib bo\'lmadi:', e)
elif CAFSD.endswith('.zip') and os.path.exists(CAFSD):
    import zipfile
    z = zipfile.ZipFile(CAFSD)
if z is not None:
    allnames = z.namelist()
    imgs = [n for n in allnames if n.lower().endswith(('.jpg', '.jpeg', '.png')) and '/images/' in n]
    say('ISSAI arxivida rasmlar:', len(imgs))
    random.shuffle(imgs)
    nameset = set(allnames)
    got = 0
    for n in imgs[:1300]:
        try:
            z.extract(n, '/tmp/cafsd')
            got += 1
            ln = n.replace('/images/', '/labels/').rsplit('.', 1)[0] + '.txt'
            if ln in nameset:
                z.extract(ln, '/tmp/cafsd')
        except Exception as e:
            say('xato', n, e)
    say('ISSAI dan olindi:', got)
CAFSD = '/tmp/cafsd'
os.makedirs(CAFSD, exist_ok=True)
names = open(os.path.join(OUT, 'labels.txt'), encoding='utf-8').read().split('\n')
excl = {i for i, n in enumerate(names) if n.startswith('tushpara')}
others = []
for p in glob.glob(os.path.join(CAFSD, '**', '*.jpg'), recursive=True) + glob.glob(os.path.join(CAFSD, '**', '*.png'), recursive=True):
    lbl = p.replace('/images/', '/labels/').rsplit('.', 1)[0] + '.txt'
    if os.path.exists(lbl):
        try:
            ids = {int(line.split()[0]) for line in open(lbl) if line.strip()}
            if ids & excl:
                continue
        except Exception:
            pass
    others.append(p)
random.shuffle(others)
others = others[:900]
say('boshqa ovqat rasmlari:', len(others))
ngen = len(paths)
if others:
    if 'other' not in classes:
        classes = classes + ['other']
    paths += others
    labels += ['other'] * len(others)
is_gen = [True] * ngen + [False] * (len(paths) - ngen)

idx = {c: i for i, c in enumerate(classes)}
y = np.array([idx[l] for l in labels], dtype=np.int32)
order = list(range(len(paths)))
random.shuffle(order)
paths = [paths[i] for i in order]
is_gen = [is_gen[i] for i in order]
y = y[order]

# Har bir sinfdan ~15% tekshiruv uchun
val_mask = np.zeros(len(paths), bool)
for c in range(len(classes)):
    ids = np.where(y == c)[0]
    val_mask[ids[:max(2, int(len(ids) * 0.15))]] = True
tr_p, tr_y = [p for p, m in zip(paths, val_mask) if not m], y[~val_mask]
tr_g = [g for g, m in zip(is_gen, val_mask) if not m]
va_p, va_y = [p for p, m in zip(paths, val_mask) if m], y[val_mask]
say('sinflar:', classes, 'o\'qitish:', len(tr_p), 'tekshiruv:', len(va_p))


def load(p, lab):
    img = tf.io.decode_image(tf.io.read_file(p), channels=3, expand_animations=False)
    img = tf.image.resize(img, (IMG, IMG))
    return img, lab


aug = tf.keras.Sequential([
    tf.keras.layers.RandomFlip('horizontal'),
    tf.keras.layers.RandomRotation(0.08),
    tf.keras.layers.RandomZoom((-0.35, 0.15)),
    tf.keras.layers.RandomTranslation(0.1, 0.1),
    tf.keras.layers.RandomContrast(0.35),
    tf.keras.layers.RandomBrightness(0.3, value_range=(0, 255)),
])


def augment(img, lab):
    img = aug(img, training=True)
    # telefon kamerasiga o'xshash: shovqin va ozgina xiralik
    img = img + tf.random.normal(tf.shape(img), stddev=tf.random.uniform([], 0, 8))
    img = tf.clip_by_value(img, 0, 255)
    return img, lab


tr = tf.data.Dataset.from_tensor_slices((tr_p, tr_y)).shuffle(2000).map(load, num_parallel_calls=4)
# kam sinflarni ko'paytirish (oversampling): har bir yaratilgan rasm 8 marta, turli augmentatsiya bilan
rep = tf.data.Dataset.from_tensor_slices(([p for p, g in zip(tr_p, tr_g) if g],
                                          np.array([l for l, g in zip(tr_y, tr_g) if g], dtype=np.int32))).map(load).repeat(8)
tr = tr.concatenate(rep).shuffle(3000).map(augment, num_parallel_calls=4).batch(32).prefetch(2)
va = tf.data.Dataset.from_tensor_slices((va_p, va_y)).map(load).batch(32)

base = tf.keras.applications.MobileNetV3Small(input_shape=(IMG, IMG, 3), include_top=False, weights=(None if os.environ.get('WEIGHTS') == 'None' else 'imagenet'),
                                              pooling='avg', include_preprocessing=True)
base.trainable = False
inp = tf.keras.Input((IMG, IMG, 3))
x = base(inp, training=False)
x = tf.keras.layers.Dropout(0.3)(x)
out = tf.keras.layers.Dense(len(classes), activation='softmax')(x)
model = tf.keras.Model(inp, out)
model.compile(tf.keras.optimizers.Adam(1e-3), 'sparse_categorical_crossentropy', metrics=['accuracy'])
model.fit(tr, validation_data=va, epochs=int(os.environ.get('E1', 14)), verbose=2)

base.trainable = True
for layer in base.layers[:-40]:
    layer.trainable = False
model.compile(tf.keras.optimizers.Adam(1e-4), 'sparse_categorical_crossentropy', metrics=['accuracy'])
h = model.fit(tr, validation_data=va, epochs=int(os.environ.get('E2', 8)), verbose=2)
say('oxirgi tekshiruv aniqligi:', h.history['val_accuracy'][-1])

pred = np.argmax(model.predict(va, verbose=0), 1)
for c in range(len(classes)):
    m = va_y == c
    if m.sum():
        say(f'  {classes[c]}: {int((pred[m] == c).sum())}/{int(m.sum())} to\'g\'ri; adashgan: '
            + ', '.join(classes[p] for p in pred[m] if p != c))

conv = tf.lite.TFLiteConverter.from_keras_model(model)
conv.optimizations = [tf.lite.Optimize.DEFAULT]
conv.target_spec.supported_types = [tf.float16]
open(os.path.join(OUT, 'uz.tflite'), 'wb').write(conv.convert())
open(os.path.join(OUT, 'uz_labels.txt'), 'w').write('\n'.join(classes))
say('tayyor:', os.path.getsize(os.path.join(OUT, 'uz.tflite')), 'bayt')
