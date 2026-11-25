package uz.soglomhayot;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.IBinder;

/** Fonda qadam sanaydigan xizmat. Bildirishnomada bugungi qadamlar ko'rinadi. */
public class StepService extends Service implements SensorEventListener {
    static final String CH = "steps";
    private static final int NID = 77;

    private SensorManager sm;
    private int mode = 0; // 1 counter, 2 detector, 3 accelerometer
    private long lastNotif = 0;
    private int shown = -1;

    // akselerometr uchun oddiy qadam aniqlash
    private float avg = 9.8f;
    private boolean above = false;
    private long lastStep = 0;

    static boolean hasPermission(Context c) {
        return Build.VERSION.SDK_INT < 29
                || c.checkSelfPermission(Manifest.permission.ACTIVITY_RECOGNITION) == PackageManager.PERMISSION_GRANTED;
    }

    static String sensorType(Context c) {
        SensorManager s = (SensorManager) c.getSystemService(Context.SENSOR_SERVICE);
        if (s == null) return "none";
        if (s.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) != null) return "counter";
        if (s.getDefaultSensor(Sensor.TYPE_STEP_DETECTOR) != null) return "detector";
        if (s.getDefaultSensor(Sensor.TYPE_ACCELEROMETER) != null) return "accel";
        return "none";
    }

    static void start(Context c) {
        if (!hasPermission(c)) return;
        if ("none".equals(sensorType(c))) return;
        try {
            Intent i = new Intent(c, StepService.class);
            if (Build.VERSION.SDK_INT >= 26) c.startForegroundService(i);
            else c.startService(i);
        } catch (Exception ignored) {}
    }

    static void ensureChannel(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm == null || nm.getNotificationChannel(CH) != null) return;
        NotificationChannel ch = new NotificationChannel(CH, Texts.get(c, "stepsChannel", "Qadamlar"),
                NotificationManager.IMPORTANCE_MIN);
        ch.setShowBadge(false);
        nm.createNotificationChannel(ch);
    }

    private Notification build(int steps) {
        Intent open = new Intent(this, MainActivity.class);
        PendingIntent pi = PendingIntent.getActivity(this, 0, open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26
                ? new Notification.Builder(this, CH) : new Notification.Builder(this);
        return b.setSmallIcon(R.drawable.ic_stat_steps)
                .setContentTitle(Texts.get(this, "stepsTitle", "Bugun qadamlar") + ": " + steps)
                .setContentText(Texts.get(this, "stepsText", "Sog'lom Hayot qadamlarni sanamoqda"))
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setShowWhen(false)
                .setContentIntent(pi)
                .build();
    }

    @Override
    public void onCreate() {
        super.onCreate();
        ensureChannel(this);
        Notification n = build(StepStore.todaySteps(this));
        try {
            if (Build.VERSION.SDK_INT >= 34) startForeground(NID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_HEALTH);
            else startForeground(NID, n);
        } catch (Exception e) {
            stopSelf();
            return;
        }
        sm = (SensorManager) getSystemService(SENSOR_SERVICE);
        if (sm == null) { stopSelf(); return; }
        Sensor s = sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        if (s != null) { mode = 1; sm.registerListener(this, s, SensorManager.SENSOR_DELAY_NORMAL); return; }
        s = sm.getDefaultSensor(Sensor.TYPE_STEP_DETECTOR);
        if (s != null) { mode = 2; sm.registerListener(this, s, SensorManager.SENSOR_DELAY_NORMAL); return; }
        s = sm.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        if (s != null) { mode = 3; sm.registerListener(this, s, SensorManager.SENSOR_DELAY_GAME); return; }
        stopSelf();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY;
    }

    @Override
    public void onSensorChanged(SensorEvent e) {
        int steps;
        if (mode == 1) {
            steps = StepStore.onCounter(this, e.values[0]);
        } else if (mode == 2) {
            steps = StepStore.add(this, 1);
        } else {
            float x = e.values[0], y = e.values[1], z = e.values[2];
            float m = (float) Math.sqrt(x * x + y * y + z * z);
            avg = avg * 0.9f + m * 0.1f;
            long now = System.currentTimeMillis();
            if (!above && m > avg + 1.8f && now - lastStep > 300) {
                above = true;
                lastStep = now;
                steps = StepStore.add(this, 1);
            } else {
                if (above && m < avg) above = false;
                return;
            }
        }
        long now = System.currentTimeMillis();
        if (steps != shown && (now - lastNotif > 20000 || shown < 0)) {
            lastNotif = now;
            shown = steps;
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.notify(NID, build(steps));
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}

    @Override
    public void onDestroy() {
        if (sm != null) sm.unregisterListener(this);
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }
}
