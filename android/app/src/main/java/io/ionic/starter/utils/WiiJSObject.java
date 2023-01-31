package io.ionic.starter.utils;

import com.getcapacitor.JSObject;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Iterator;

public class WiiJSObject extends JSObject {

    public JSObject merge(JSONObject object) throws JSONException {

        Iterator<String> keysIterator = object.keys();

        while (keysIterator.hasNext()) {
            String key = keysIterator.next();
            Object value = object.get(key);
            this.put(key, value);
        }

        return this;
    }
}
