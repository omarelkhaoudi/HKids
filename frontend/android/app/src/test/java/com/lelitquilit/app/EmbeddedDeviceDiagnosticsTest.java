package com.lelitquilit.app;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class EmbeddedDeviceDiagnosticsTest {

    @Test
    public void percentageHandlesMissingTotals() {
        assertEquals(-1, EmbeddedDeviceDiagnostics.percentage(10L, 0L));
        assertEquals(-1, EmbeddedDeviceDiagnostics.percentage(-1L, 100L));
    }

    @Test
    public void percentageClampsToDeviceSafeRange() {
        assertEquals(50, EmbeddedDeviceDiagnostics.percentage(50L, 100L));
        assertEquals(100, EmbeddedDeviceDiagnostics.percentage(150L, 100L));
    }

    @Test
    public void classifiesStoragePressure() {
        assertEquals("critical", EmbeddedDeviceDiagnostics.classifyStoragePressure(5L, 100L));
        assertEquals("warning", EmbeddedDeviceDiagnostics.classifyStoragePressure(12L, 100L));
        assertEquals("healthy", EmbeddedDeviceDiagnostics.classifyStoragePressure(50L, 100L));
        assertEquals("unknown", EmbeddedDeviceDiagnostics.classifyStoragePressure(1L, 0L));
    }

    @Test
    public void classifiesMemoryPressure() {
        assertEquals("critical", EmbeddedDeviceDiagnostics.classifyMemoryPressure(30L, 100L, 40L, false));
        assertEquals("critical", EmbeddedDeviceDiagnostics.classifyMemoryPressure(60L, 100L, 40L, true));
        assertEquals("warning", EmbeddedDeviceDiagnostics.classifyMemoryPressure(18L, 100L, 10L, false));
        assertEquals("healthy", EmbeddedDeviceDiagnostics.classifyMemoryPressure(50L, 100L, 10L, false));
    }

    @Test
    public void calculatesOverallEmbeddedHealth() {
        assertEquals("critical", EmbeddedDeviceDiagnostics.calculateEmbeddedHealth(
            "critical", "healthy", 100, true, true, true, true));
        assertEquals("warning", EmbeddedDeviceDiagnostics.calculateEmbeddedHealth(
            "healthy", "healthy", 15, false, true, true, true));
        assertEquals("warning", EmbeddedDeviceDiagnostics.calculateEmbeddedHealth(
            "healthy", "healthy", 100, true, false, true, true));
        assertEquals("warning", EmbeddedDeviceDiagnostics.calculateEmbeddedHealth(
            "healthy", "healthy", 100, true, true, true, false));
        assertEquals("healthy", EmbeddedDeviceDiagnostics.calculateEmbeddedHealth(
            "healthy", "healthy", 100, true, true, true, true));
    }
}
