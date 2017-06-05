package com.mysampleapp.util;

import java.io.*;

import android.content.res.Resources;
import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;


/**
 * An object for reading from a JSON resource file and constructing an object from that resource file using Gson.
 */
public class JSONResourceReader {

    // === [ Private Data Members ] ============================================

    // Our JSON, in string form.
    private String jsonString;
    private static final String LOGTAG = JSONResourceReader.class.getSimpleName();

    // === [ Public API ] ======================================================

    /**
     * Read from a resources file and create a {@link JSONResourceReader} object that will allow the creation of other
     * objects from this resource.
     *
     * @param resources An application {@link Resources} object.
     * @param id        The id for the resource to load, typically held in the raw/ folder.
     */
    public JSONResourceReader(Resources resources, int id) {
        InputStream resourceReader = resources.openRawResource(id);
        Writer writer = new StringWriter();
        try {
            BufferedReader reader = new BufferedReader(new InputStreamReader(resourceReader, "UTF-8"));
            String line = reader.readLine();
            while (line != null) {
                writer.write(line);
                line = reader.readLine();
            }
        } catch (Exception e) {
            Log.e(LOGTAG, "Unhandled exception while using JSONResourceReader", e);
        } finally {
            try {
                resourceReader.close();
            } catch (Exception e) {
                Log.e(LOGTAG, "Unhandled exception while using JSONResourceReader", e);
            }
        }

        jsonString = writer.toString();
    }

    public JSONObject constructUsingJson() {
        JSONObject jobj = null;
        try {
            jobj = new JSONObject(jsonString);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return jobj;
    }
}