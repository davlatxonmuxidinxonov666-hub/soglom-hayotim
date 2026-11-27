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

    /** Natija: [{label, score, count}], ishonch bo'yicha tartiblangan. */
    synchronized String detect(Bitmap src) throws Exception {
        Bitmap bm = Bitmap.createScaledBitmap(src, size, size, true);
        ByteBuffer input = ByteBuffer.allocateDirect(4 * size * size * 3).order(ByteOrder.nativeOrder());
        int[] px = new int[size * size];
        bm.getPixels(px, 0, size, 0, 0, size, size);
        for (int p : px) {
            input.putFloat(((p >> 16) & 0xFF) / 255f);
            input.putFloat(((p >> 8) & 0xFF) / 255f);
            input.putFloat((p & 0xFF) / 255f);
        }
        input.rewind();

        float[][][] out = channelsFirst ? new float[1][nc + 4][n] : new float[1][n][nc + 4];
        tfl.run(input, out);

        List<Box> boxes = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            int best = -1;
            float bs = 0;
            for (int k = 0; k < nc; k++) {
                float s = channelsFirst ? out[0][4 + k][i] : out[0][i][4 + k];
                if (s > bs) { bs = s; best = k; }
            }
            if (bs < 0.30f) continue;
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
            if (keep.size() >= 30) break;
        }
        Map<Integer, float[]> agg = new LinkedHashMap<>(); // cls -> [bestScore, count]
        for (Box b : keep) {
            float[] a = agg.get(b.cls);
            if (a == null) agg.put(b.cls, new float[]{b.score, 1});
            else a[1] += 1;
        }
        JSONArray arr = new JSONArray();
        for (Map.Entry<Integer, float[]> e : agg.entrySet()) {
            JSONObject o = new JSONObject();
            int c = e.getKey();
            o.put("label", c < labels.size() ? labels.get(c) : ("class_" + c));
            o.put("score", Math.round(e.getValue()[0] * 100) / 100.0);
            o.put("count", (int) e.getValue()[1]);
            arr.put(o);
        }
        return arr.toString();
    }
}
