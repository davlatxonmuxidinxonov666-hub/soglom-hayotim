package uz.soglomhayot;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.media.ExifInterface;
import android.provider.MediaStore;
import android.util.Base64;

import androidx.core.content.FileProvider;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends Activity {
    private WebView web;
    private Uri photoUri;
    private static final int REQ_CAMERA = 31, REQ_GALLERY = 32;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().setStatusBarColor(0xFF059669);
        getWindow().setNavigationBarColor(0xFFFFFFFF);
        if (Build.VERSION.SDK_INT >= 26) {
            android.view.View d = getWindow().getDecorView();
            d.setSystemUiVisibility(d.getSystemUiVisibility() | android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        }

        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setTextZoom(100);
        web.setWebViewClient(new WebViewClient());
        web.addJavascriptInterface(new Bridge(getApplicationContext()), "Android");
        setContentView(web);
        web.loadUrl("file:///android_asset/index.html");

        if (stepsEnabled()) StepService.start(this);
        WaterReceiver.schedule(this);
    }

    private boolean stepsEnabled() {
        return getSharedPreferences("steps", MODE_PRIVATE).getBoolean("enabled", false);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.evaluateJavascript("window.onAppResume&&onAppResume()", null);
    }

    @Override
    public void onBackPressed() {
        if (web != null) {
            web.evaluateJavascript("window.onBack?onBack():false", v -> {
                if (!"true".equals(v)) MainActivity.super.onBackPressed();
            });
        } else super.onBackPressed();
    }

    /** Qadam sanash uchun kerakli ruxsatlarni so'raydi. */
    private void askStepPermissions() {
        List<String> need = new ArrayList<>();
        if (Build.VERSION.SDK_INT >= 29
                && checkSelfPermission(Manifest.permission.ACTIVITY_RECOGNITION) != PackageManager.PERMISSION_GRANTED)
            need.add(Manifest.permission.ACTIVITY_RECOGNITION);
        if (Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED)
            need.add(Manifest.permission.POST_NOTIFICATIONS);
        if (need.isEmpty()) {
            afterPermissions();
        } else {
            requestPermissions(need.toArray(new String[0]), 21);
        }
    }

    private void afterPermissions() {
        if (StepService.hasPermission(this)) {
            getSharedPreferences("steps", MODE_PRIVATE).edit().putBoolean("enabled", true).apply();
            StepService.start(this);
            askBattery();
        }
        if (web != null) web.evaluateJavascript("window.onStepsState&&onStepsState()", null);
    }

    /** Telefon ilovani fonda o'chirib qo'ymasligi uchun batareya cheklovidan chiqarishni so'raydi. */
    private void askBattery() {
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null && !pm.isIgnoringBatteryOptimizations(getPackageName())) {
                Intent i = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                        Uri.parse("package:" + getPackageName()));
                startActivity(i);
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] perms, int[] res) {
        super.onRequestPermissionsResult(code, perms, res);
        if (code == 21) afterPermissions();
        if (code == 22 && web != null) web.evaluateJavascript("window.onStepsState&&onStepsState()", null);
    }

    // ---------- Rasm orqali taomni aniqlash ----------
    private void startPhoto(boolean camera) {
        try {
            if (camera) {
                File dir = new File(getCacheDir(), "photos");
                dir.mkdirs();
                File f = new File(dir, "shot.jpg");
                photoUri = FileProvider.getUriForFile(this, getPackageName() + ".files", f);
                Intent i = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                i.putExtra(MediaStore.EXTRA_OUTPUT, photoUri);
                i.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                startActivityForResult(i, REQ_CAMERA);
            } else {
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.setType("image/*");
                startActivityForResult(Intent.createChooser(i, null), REQ_GALLERY);
            }
        } catch (Exception e) {
            sendAi(null, null, "nocamera");
        }
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req != REQ_CAMERA && req != REQ_GALLERY) return;
        if (res != RESULT_OK) { sendAi(null, null, "cancel"); return; }
        final Uri uri = req == REQ_CAMERA ? photoUri : (data != null ? data.getData() : null);
        if (uri == null) { sendAi(null, null, "error"); return; }
        sendAi(null, null, "busy");
        new Thread(() -> {
            try {
                Bitmap bm = loadBitmap(uri, 1024);
                String result = AiDetector.get(this).detect(bm);
                Bitmap th = Bitmap.createScaledBitmap(bm, 320, Math.max(1, 320 * bm.getHeight() / bm.getWidth()), true);
                ByteArrayOutputStream bo = new ByteArrayOutputStream();
                th.compress(Bitmap.CompressFormat.JPEG, 80, bo);
                String thumb = "data:image/jpeg;base64," + Base64.encodeToString(bo.toByteArray(), Base64.NO_WRAP);
                sendAi(result, thumb, "ok");
            } catch (Throwable e) {
                sendAi(null, null, "error");
            }
        }).start();
    }

    private Bitmap loadBitmap(Uri uri, int max) throws Exception {
        BitmapFactory.Options o = new BitmapFactory.Options();
        o.inJustDecodeBounds = true;
        try (InputStream in = getContentResolver().openInputStream(uri)) { BitmapFactory.decodeStream(in, null, o); }
        int sample = 1;
        while (Math.max(o.outWidth, o.outHeight) / (sample * 2) >= max) sample *= 2;
        BitmapFactory.Options o2 = new BitmapFactory.Options();
        o2.inSampleSize = sample;
        Bitmap bm;
        try (InputStream in = getContentResolver().openInputStream(uri)) { bm = BitmapFactory.decodeStream(in, null, o2); }
        if (bm == null) throw new Exception("decode");
        int rot = 0;
        try (InputStream in = getContentResolver().openInputStream(uri)) {
            int or = new ExifInterface(in).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL);
            if (or == ExifInterface.ORIENTATION_ROTATE_90) rot = 90;
            else if (or == ExifInterface.ORIENTATION_ROTATE_180) rot = 180;
            else if (or == ExifInterface.ORIENTATION_ROTATE_270) rot = 270;
        } catch (Exception ignored) {}
        if (rot != 0) {
            Matrix m = new Matrix();
            m.postRotate(rot);
            bm = Bitmap.createBitmap(bm, 0, 0, bm.getWidth(), bm.getHeight(), m, true);
        }
        return bm;
    }

    private void sendAi(String json, String thumb, String state) {
        final String js = "window.onAiResult&&onAiResult(" + JSONObject.quote(state) + "," + (json == null ? "null" : json) + ","
                + (thumb == null ? "null" : JSONObject.quote(thumb)) + ")";
        runOnUiThread(() -> { if (web != null) web.evaluateJavascript(js, null); });
    }

    private class Bridge {
        private final Context app;

        Bridge(Context app) { this.app = app; }

        @JavascriptInterface
        public String steps() { return StepStore.json(app); }

        /** counter / detector / accel / none */
        @JavascriptInterface
        public String sensor() { return StepService.sensorType(app); }

        @JavascriptInterface
        public boolean stepsOn() { return stepsEnabled() && StepService.hasPermission(app); }

        @JavascriptInterface
        public void enableSteps() { runOnUiThread(MainActivity.this::askStepPermissions); }

        @JavascriptInterface
        public void disableSteps() {
            app.getSharedPreferences("steps", MODE_PRIVATE).edit().putBoolean("enabled", false).apply();
            app.stopService(new Intent(app, StepService.class));
        }

        @JavascriptInterface
        public void setWater(int everyHours) {
            WaterReceiver.set(app, everyHours);
            if (everyHours > 0 && Build.VERSION.SDK_INT >= 33
                    && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                runOnUiThread(() -> requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 22));
            }
        }

        @JavascriptInterface
        public void setTexts(String json) { Texts.save(app, json); }

        @JavascriptInterface
        public boolean aiAvailable() { return AiDetector.available(app); }

        @JavascriptInterface
        public void takePhoto() { runOnUiThread(() -> startPhoto(true)); }

        @JavascriptInterface
        public void pickPhoto() { runOnUiThread(() -> startPhoto(false)); }
    }
}
