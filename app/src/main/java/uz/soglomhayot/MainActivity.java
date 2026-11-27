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

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends Activity {
    private WebView web;

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
    }
}
