package uz.soglomhayot;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Iterator;
import java.util.Locale;

/** Qadamlarni kunlar bo'yicha saqlaydi (telefon xotirasida). */
public final class StepStore {
    private static final String P = "steps";

    private StepStore() {}

    private static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(P, Context.MODE_PRIVATE);
    }

    static String today() {
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
    }

    /** Kun almashgan bo'lsa, kechagi natijani tarixga yozib, hisobni nolga qaytaradi. */
    private static boolean rollDay(SharedPreferences p, SharedPreferences.Editor e) {
        String d = today();
        String saved = p.getString("day", d);
        boolean rolled = false;
        if (!d.equals(saved)) {
            rolled = true;
            try {
                JSONObject h = new JSONObject(p.getString("hist", "{}"));
                h.put(saved, p.getInt("today", 0));
                // 400 kundan eskisini o'chiramiz
                if (h.length() > 400) {
                    String oldest = null;
                    Iterator<String> it = h.keys();
                    while (it.hasNext()) {
                        String k = it.next();
                        if (oldest == null || k.compareTo(oldest) < 0) oldest = k;
                    }
                    if (oldest != null) h.remove(oldest);
                }
                e.putString("hist", h.toString());
            } catch (Exception ignored) {}
            e.putInt("today", 0);
        }
        e.putString("day", d);
        return rolled;
    }

    /** TYPE_STEP_COUNTER sensori: telefon yoqilgandan beri jami qadamlar. */
    static synchronized int onCounter(Context c, float raw) {
        SharedPreferences p = prefs(c);
        SharedPreferences.Editor e = p.edit();
        boolean rolled = rollDay(p, e);
        float last = p.getFloat("last", -1f);
        int today = rolled ? 0 : p.getInt("today", 0);
        if (last >= 0) {
            float delta = raw - last;
            if (delta < 0) delta = raw;               // telefon qayta yoqilgan
            if (delta > 0 && delta < 60000) today += (int) delta;
        }
        e.putFloat("last", raw);
        e.putInt("today", today);
        e.apply();
        return today;
    }

    /** Qadam detektori yoki akselerometr: har bir qadam uchun. */
    static synchronized int add(Context c, int n) {
        SharedPreferences p = prefs(c);
        SharedPreferences.Editor e = p.edit();
        boolean rolled = rollDay(p, e);
        int today = rolled ? 0 : p.getInt("today", 0);
        today += n;
        e.putInt("today", today);
        e.apply();
        return today;
    }

    static void resetBaseline(Context c) {
        prefs(c).edit().putFloat("last", -1f).apply();
    }

    static int todaySteps(Context c) {
        SharedPreferences p = prefs(c);
        return today().equals(p.getString("day", "")) ? p.getInt("today", 0) : 0;
    }

    static String json(Context c) {
        SharedPreferences p = prefs(c);
        try {
            JSONObject h = new JSONObject(p.getString("hist", "{}"));
            String day = p.getString("day", "");
            if (!day.isEmpty() && !day.equals(today())) h.put(day, p.getInt("today", 0));
            JSONObject o = new JSONObject();
            o.put("today", todaySteps(c));
            o.put("date", today());
            o.put("hist", h);
            return o.toString();
        } catch (Exception e) {
            return "{\"today\":0,\"hist\":{}}";
        }
    }
}
