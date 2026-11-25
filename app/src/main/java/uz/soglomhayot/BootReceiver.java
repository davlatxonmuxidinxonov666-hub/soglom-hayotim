package uz.soglomhayot;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent i) {
        String a = i.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(a)) StepStore.resetBaseline(c);
        if (c.getSharedPreferences("steps", Context.MODE_PRIVATE).getBoolean("enabled", false)) {
            StepService.start(c);
        }
        WaterReceiver.schedule(c);
    }
}
