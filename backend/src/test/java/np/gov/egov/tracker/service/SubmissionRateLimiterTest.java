package np.gov.egov.tracker.service;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;

class SubmissionRateLimiterTest {

    private final AtomicLong now = new AtomicLong(1_000_000);
    private final Clock clock = new Clock() {
        @Override public ZoneOffset getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(java.time.ZoneId zone) { return this; }
        @Override public Instant instant() { return Instant.ofEpochMilli(now.get()); }
    };

    @Test
    void allowsUpToLimitThenBlocksUntilWindowPasses() {
        SubmissionRateLimiter limiter = new SubmissionRateLimiter(3, Duration.ofMinutes(15), clock);
        for (int i = 0; i < 3; i++) assertThat(limiter.tryAcquire("1.2.3.4")).isEmpty();

        assertThat(limiter.tryAcquire("1.2.3.4")).hasValue(900);
        assertThat(limiter.tryAcquire("5.6.7.8")).isEmpty(); // other clients unaffected

        now.addAndGet(Duration.ofMinutes(15).toMillis());
        assertThat(limiter.tryAcquire("1.2.3.4")).isEmpty();
    }
}
