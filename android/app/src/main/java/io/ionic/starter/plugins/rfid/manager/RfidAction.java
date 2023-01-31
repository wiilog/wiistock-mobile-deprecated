package io.ionic.starter.plugins.rfid.manager;

public enum RfidAction {

    RUN_ACTION_CONNECT("connect"),
    RUN_ACTION_DISCONNECT("disconnect"),
    RUN_ACTION_CONFIGURE("configure"),
    RUN_ACTION_START_SCAN("startScan"),
    RUN_ACTION_STOP_SCAN("stopScan"),
    RUN_ACTION_CONNECTED_DEVICE_INFO("connectedDeviceInfo");

    private final String value;

    RfidAction(String value) {
        this.value = value;
    }

    public String toString() {
        return this.value;
    }

}
