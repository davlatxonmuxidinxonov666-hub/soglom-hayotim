package uz.soglomhayot;

import android.content.Context;
import android.content.res.AssetFileDescriptor;
import android.graphics.Bitmap;

import org.json.JSONArray;
import org.json.JSONObject;
import org.tensorflow.lite.Interpreter;

import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Telefon ichida ishlaydigan taom aniqlovchi (YOLOv8, Central Asian Food Scenes Dataset, ISSAI).
 * Internet kerak emas.
 */
final class AiDetector {
    private static AiDetector inst;

    private final Interpreter tfl;
    private final List<String> labels = new ArrayList<>();
    private final int size;
    private final boolean channelsFirst; // chiqish: [1, 4+nc, N] yoki [1, N, 4+nc]
    private final int nc, n;

    static boolean available(Context c) {
        try {
            String[] f = c.getAssets().list("ai");
            if (f == null) return false;
            boolean m = false, l = false;
            for (String s : f) { if (s.equals("food.tflite")) m = true; if (s.equals("labels.txt")) l = true; }
            return m && l;
        } catch (Exception e) {
            return false;
        }
    }

    static synchronized AiDetector get(Context c) throws Exception {
        if (inst == null) inst = new AiDetector(c.getApplicationContext());
        return inst;
    }

    private AiDetector(Context c) throws Exception {
        AssetFileDescriptor fd = c.getAssets().openFd("ai/food.tflite");
        MappedByteBuffer model;
        try (FileInputStream in = new FileInputStream(fd.getFileDescriptor())) {
            model = in.getChannel().map(FileChannel.MapMode.READ_ONLY, fd.getStartOffset(), fd.getDeclaredLength());
        }
        Interpreter.Options o = new Interpreter.Options();
        o.setNumThreads(4);
        tfl = new Interpreter(model, o);
        try (BufferedReader r = new BufferedReader(new InputStreamReader(c.getAssets().open("ai/labels.txt"), "UTF-8"))) {
            String line;
            while ((line = r.readLine()) != null) labels.add(line.trim());
        }
        int[] in = tfl.getInputTensor(0).shape();   // [1, H, W, 3]
        size = in[1];
        int[] out = tfl.getOutputTensor(0).shape();
        if (out[1] == labels.size() + 4) { channelsFirst = true; nc = labels.size(); n = out[2]; }
        else { channelsFirst = false; nc = out[2] - 4; n = out[1]; }
    }

    private static final class Box {
        int cls; float score, x, y, w, h;
    }

    private static float iou(Box a, Box b) {
        float ax1 = a.x - a.w / 2, ay1 = a.y - a.h / 2, ax2 = a.x + a.w / 2, ay2 = a.y + a.h / 2;
        float bx1 = b.x - b.w / 2, by1 = b.y - b.h / 2, bx2 = b.x + b.w / 2, by2 = b.y + b.h / 2;
        float iw = Math.max(0, Math.min(ax2, bx2) - Math.max(ax1, bx1));
        float ih = Math.max(0, Math.min(ay2, by2) - Math.max(ay1, by1));
        float inter = iw * ih;
        float uni = a.w * a.h + b.w * b.h - inter;
        return uni <= 0 ? 0 : inter / uni;
    }

    /** Rasmni modelga tayyorlash: cho'zib (stretch) yoki proporsiyani saqlab (letterbox, kulrang chekka bilan). */
    private ByteBuffer prepare(Bitmap src, boolean letterbox) {
        Bitmap bm;
        if (!letterbox) {
            bm = Bitmap.createScaledBitmap(src, size, size, true);
        } else {
            float r = (float) size / Math.max(src.getWidth(), src.getHeight());
            int w = Math.max(1, Math.round(src.getWidth() * r)), h = Math.max(1, Math.round(src.getHeight() * r));
            Bitmap scaled = Bitmap.createScaledBitmap(src, w, h, true);
            bm = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
            android.graphics.Canvas cv = new android.graphics.Canvas(bm);
            cv.drawColor(0xFF727272);
            cv.drawBitmap(scaled, (size - w) / 2f, (size - h) / 2f, null);
        }
        ByteBuffer input = ByteBuffer.allocateDirect(4 * size * size * 3).order(ByteOrder.nativeOrder());
        int[] px = new int[size * size];
        bm.getPixels(px, 0, size, 0, 0, size, size);
        for (int p : px) {
            input.putFloat(((p >> 16) & 0xFF) / 255f);
            input.putFloat(((p >> 8) & 0xFF) / 255f);
            input.putFloat((p & 0xFF) / 255f);
        }
        input.rewind();
        return input;
    }

    /** Bitta o'tish: sinf -> [eng yuqori ishonch, soni]; bestAny — har bir sinf uchun eng yuqori ishonch (taxminlar uchun). */
    private void pass(ByteBuffer input, Map<Integer, float[]> agg, float[] bestAny) {
        float[][][] out = channelsFirst ? new float[1][nc + 4][n] : new float[1][n][nc + 4];
        tfl.run(input, out);
        List<Box> boxes = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            int best = -1;
            float bs = 0;
            for (int k = 0; k < nc; k++) {
                float s = channelsFirst ? out[0][4 + k][i] : out[0][i][4 + k];
                if (s > bestAny[k]) bestAny[k] = s;
                if (s > bs) { bs = s; best = k; }
            }
            if (bs < 0.25f) continue;
            Box b = new Box();
            b.cls = best; b.score = bs;
            if (channelsFirst) { b.x = out[0][0][i]; b.y = out[0][1][i]; b.w = out[0][2][i]; b.h = out[0][3][i]; }
            else { b.x = out[0][i][0]; b.y = out[0][i][1]; b.w = out[0][i][2]; b.h = out[0][i][3]; }
            boxes.add(b);
        }
        Collections.sort(boxes, (a, b) -> Float.compare(b.score, a.score));
        List<Box> keep = new ArrayList<>();
        for (Box b : boxes) {
            boolean ok = true;
            for (Box k : keep) if (k.cls == b.cls && iou(k, b) > 0.5f) { ok = false; break; }
            if (ok) keep.add(b);
            if (keep.size() >= 40) break;
        }
        Map<Integer, float[]> local = new LinkedHashMap<>();
        for (Box b : keep) {
            float[] a = local.get(b.cls);
            if (a == null) local.put(b.cls, new float[]{b.score, 1});
            else a[1] += 1;
        }
        for (Map.Entry<Integer, float[]> e : local.entrySet()) {
            float[] a = agg.get(e.getKey());
            if (a == null) agg.put(e.getKey(), e.getValue().clone());
            else { a[0] = Math.max(a[0], e.getValue()[0]); a[1] = Math.max(a[1], e.getValue()[1]); }
        }
    }

    /** Natija: {found:[{label, score, count}], guesses:[{label, score}]}. Ikki usulda tekshiriladi va natijalar birlashtiriladi. */
    synchronized String detect(Bitmap src) throws Exception {
        Map<Integer, float[]> agg = new LinkedHashMap<>();
        float[] bestAny = new float[nc];
        pass(prepare(src, true), agg, bestAny);
        pass(prepare(src, false), agg, bestAny);

        List<Map.Entry<Integer, float[]>> found = new ArrayList<>(agg.entrySet());
        Collections.sort(found, (a, b) -> Float.compare(b.getValue()[0], a.getValue()[0]));
        JSONArray arr = new JSONArray();
        for (Map.Entry<Integer, float[]> e : found) {
            JSONObject o = new JSONObject();
            int c = e.getKey();
            o.put("label", c < labels.size() ? labels.get(c) : ("class_" + c));
            o.put("score", Math.round(e.getValue()[0] * 100) / 100.0);
            o.put("count", (int) e.getValue()[1]);
            arr.put(o);
        }
        // Taxminlar: ishonchi pastroq, lekin eng yaqin 5 ta variant
        Integer[] idx = new Integer[nc];
        for (int i = 0; i < nc; i++) idx[i] = i;
        java.util.Arrays.sort(idx, (a, b) -> Float.compare(bestAny[b], bestAny[a]));
        JSONArray g = new JSONArray();
        for (int i = 0; i < nc && g.length() < 6; i++) {
            int c = idx[i];
            if (bestAny[c] < 0.05f) break;
            if (agg.containsKey(c)) continue;
            JSONObject o = new JSONObject();
            o.put("label", labels.get(c));
            o.put("score", Math.round(bestAny[c] * 100) / 100.0);
            g.put(o);
        }
        JSONObject res = new JSONObject();
        res.put("found", arr);
        res.put("guesses", g);
        return res.toString();
    }
}
