package uz.soglomhayot;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import java.util.Calendar;

/** Suv ichishni eslatish: har soat tekshiradi, tanlangan oraliqda 09:00–21:00 orasida eslatadi. */
public class WaterReceiver extends BroadcastReceiver {
    static final String CH = "water";

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences("water", Context.MODE_PRIVATE);
    }

    static void set(Context c, int everyHours) {
        prefs(c).edit().putInt("every", everyHours).apply();
        schedule(c);
    }

    static void schedule(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        PendingIntent pi = PendingIntent.getBroadcast(c, 5, new Intent(c, WaterReceiver.class),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        am.cancel(pi);
        if (prefs(c).getInt("every", 0) <= 0) return;
        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.HOUR_OF_DAY, 1);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        am.setInexactRepeating(AlarmManager.RTC_WAKEUP, cal.getTimeInMillis(), AlarmManager.INTERVAL_HOUR, pi);
    }

    @Override
    public void onReceive(Context c, Intent intent) {
        SharedPreferences p = prefs(c);
        int every = p.getInt("every", 0);
        if (every <= 0) return;
        int h = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
        if (h < 9 || h > 21) return;
        long now = System.currentTimeMillis();
        long last = p.getLong("last", 0);
        if (now - last < every * 3600_000L - 15 * 60_000L) return;
        p.edit().putLong("last", now).apply();

        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm == null) return;
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CH) == null) {
            nm.createNotificationChannel(new NotificationChannel(CH,
                    Texts.get(c, "waterChannel", "Suv eslatmasi"), NotificationManager.IMPORTANCE_DEFAULT));
        }
        PendingIntent open = PendingIntent.getActivity(c, 6, new Intent(c, MainActivity.class),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26
                ? new Notification.Builder(c, CH) : new Notification.Builder(c);
        nm.notify(88, b.setSmallIcon(R.drawable.ic_stat_water)
                .setContentTitle(Texts.get(c, "waterTitle", "Suv ichish vaqti 💧"))
                .setContentText(Texts.get(c, "waterText", "Bir stakan suv iching"))
                .setAutoCancel(true)
                .setContentIntent(open)
                .build());
    }
}
