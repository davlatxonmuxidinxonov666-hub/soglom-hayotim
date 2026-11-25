package uz.soglomhayot;

import android.content.Context;

import org.json.JSONObject;

/** Bildirishnomalar matni (tanlangan tilda, ilova ichidan yuboriladi). */
final class Texts {
    private Texts() {}

    static void save(Context c, String json) {
        c.getSharedPreferences("texts", Context.MODE_PRIVATE).edit().putString("t", json).apply();
    }

    static String get(Context c, String key, String def) {
        try {
            JSONObject o = new JSONObject(c.getSharedPreferences("texts", Context.MODE_PRIVATE).getString("t", "{}"));
            return o.optString(key, def);
        } catch (Exception e) {
            return def;
        }
    }
}
