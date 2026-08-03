package com.lelitquilit.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import android.content.Context;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;

import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class KioskProvisioningInstrumentedTest {

    @Test
    public void appContextUsesProductionPackage() {
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();

        assertEquals("com.lelitquilit.app", appContext.getPackageName());
    }

    @Test
    public void kioskComponentsAreAddressable() {
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();

        assertNotNull(KioskPolicyManager.adminComponent(appContext));
        assertNotNull(KioskPolicyManager.launcherComponent(appContext));
    }
}
