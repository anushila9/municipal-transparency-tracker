package np.gov.egov.tracker.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.OptionalLong;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Sliding-window limit on anonymous report submissions per client address, to blunt spam and flooding of the
 * admin inbox. In-memory, so it resets on restart and is per instance, which suits the single-server prototype.
 *
 * <p>Behind a reverse proxy every request arrives from the proxy's address; set
 * {@code server.forward-headers-strategy=native} there (and only there) so the real client address is used.
 */
@Component
public class SubmissionRateLimiter {

    /** Stop tracking new clients past this many, so a flood of spoofed sources can't exhaust memory. */
    private static final int MAX_TRACKED_CLIENTS = 50_000;

    private final int maxRequests;
    private final Duration window;
    private final Clock clock;
    private final ConcurrentHashMap<String, Deque<Long>> hits = new ConcurrentHashMap<>();

    @Autowired
    public SubmissionRateLimiter(@Value("${app.reports.rate-limit.max:5}") int maxRequests,
                                 @Value("${app.reports.rate-limit.window-minutes:15}") int windowMinutes) {
        this(maxRequests, Duration.ofMinutes(windowMinutes), Clock.systemUTC());
    }

    SubmissionRateLimiter(int maxRequests, Duration window, Clock clock) {
        this.maxRequests = maxRequests;
        this.window = window;
        this.clock = clock;
    }

    /**
     * Records an attempt for {@code client}. Returns empty if allowed, or the number of seconds until the
     * client may try again.
     */
    public OptionalLong tryAcquire(String client) {
        long now = clock.millis();
        long cutoff = now - window.toMillis();
        if (hits.size() > MAX_TRACKED_CLIENTS) hits.entrySet().removeIf(e -> newest(e.getValue()) < cutoff);

        Deque<Long> times = hits.computeIfAbsent(client, k -> new ArrayDeque<>());
        synchronized (times) {
            while (!times.isEmpty() && times.peekFirst() <= cutoff) times.pollFirst();
            if (times.size() >= maxRequests) {
                long retryMs = times.peekFirst() + window.toMillis() - now;
                return OptionalLong.of(Math.max(1, (retryMs + 999) / 1000));
            }
            times.addLast(now);
            return OptionalLong.empty();
        }
    }

    private static long newest(Deque<Long> times) {
        synchronized (times) {
            return times.isEmpty() ? Long.MIN_VALUE : times.peekLast();
        }
    }
}
