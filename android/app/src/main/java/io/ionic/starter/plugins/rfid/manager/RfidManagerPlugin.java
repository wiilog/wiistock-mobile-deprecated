package io.ionic.starter.plugins.rfid.manager;

import android.Manifest;
import android.util.Log;

import androidx.annotation.Nullable;

import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.Plugin;

import org.json.JSONException;

import io.ionic.starter.plugins.rfid.manager.exceptions.ZebraExceptionType;
import io.ionic.starter.plugins.rfid.manager.exceptions.ZebraRfidException;
import io.ionic.starter.plugins.rfid.manager.rfid.ZebraRfidManager;
import io.ionic.starter.utils.WiiJSObject;

import com.getcapacitor.annotation.Permission;

@CapacitorPlugin(
        name = "RfidManager",
        permissions = {
                @Permission(
                        strings = {Manifest.permission.BLUETOOTH},
                        alias = "BLUETOOTH"
                ),
        }
)
public class RfidManagerPlugin extends Plugin {

    private final static String LOG_TAG = "RFID_MANAGER_PLUGIN";

    private ZebraRfidManager zebraRfidManager;

    @Override
    public void load() {
        this.zebraRfidManager = new ZebraRfidManager(this);
    }

    @PluginMethod()
    public void run(PluginCall call) throws Exception {
        String action = call.getString("action");
        try {
            WiiJSObject result = this.treatAction(action);
            call.resolve(result);
        }
        catch(ZebraRfidException exception) {
            this.resolveError(call, exception);
        }
    }

    public void triggerPluginEvent(String event, JSObject data) {
        this.notifyListeners(event, data);
    }

    private WiiJSObject treatAction(@Nullable String action) throws ZebraRfidException {

        WiiJSObject result = new WiiJSObject();
        result.put("success", true);

        // prevent java.lang.NullPointerException
        if (action == null) {
            throw new ZebraRfidException(ZebraExceptionType.ACTION_REQUIRED);
        }

        Log.d(LOG_TAG, String.format("treatAction : %s", action));




        switch (RfidAction.valueOf("aaaaa")) {
            case RUN_ACTION_CONNECT:
                this.zebraRfidManager.connect();
                break;
            case RUN_ACTION_DISCONNECT:
                this.zebraRfidManager.disconnect();
                break;
            case RUN_ACTION_CONFIGURE:
                this.zebraRfidManager.configure();
                break;
            case RUN_ACTION_START_SCAN:
                this.zebraRfidManager.startScan();
                break;
            case RUN_ACTION_STOP_SCAN:
                this.zebraRfidManager.stopScan();
                break;
            case RUN_ACTION_CONNECTED_DEVICE_INFO:
                WiiJSObject readerInfo = this.zebraRfidManager.getConnectedDeviceInfo();
                try {
                    result.merge(readerInfo);
                } catch (JSONException e) {
                    // TODO handle ?
                    throw new RuntimeException(e);
                }
                break;
            default:
                throw new ZebraRfidException(ZebraExceptionType.ACTION_INVALID);
        }

        return result;
    }

    private void resolveError(PluginCall call, ZebraRfidException exception) {
        call.reject(exception.getType().toString(), exception);
    }

}
