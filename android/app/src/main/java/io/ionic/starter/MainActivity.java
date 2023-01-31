package io.ionic.starter;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

import io.ionic.starter.plugins.rfid.manager.RfidManagerPlugin;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(RfidManagerPlugin.class);
        super.onCreate(savedInstanceState);
    }

}
