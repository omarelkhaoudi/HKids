package com.lelitquilit.app;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class KioskRecoveryTest {

    @Test
    public void restartBackoffGrowsAndCaps() {
        assertEquals(1200L, KioskRecovery.restartDelayForAttempt(0));
        assertEquals(1200L, KioskRecovery.restartDelayForAttempt(1));
        assertEquals(4800L, KioskRecovery.restartDelayForAttempt(2));
        assertEquals(10800L, KioskRecovery.restartDelayForAttempt(3));
        assertEquals(60000L, KioskRecovery.restartDelayForAttempt(99));
    }
}
