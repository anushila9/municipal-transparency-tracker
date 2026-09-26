package np.gov.egov.tracker.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TextSanitizerTest {

    @Test
    void blankBecomesNull() {
        assertThat(TextSanitizer.multiLine("   \n\t ")).isNull();
        assertThat(TextSanitizer.singleLine("​  ")).isNull();
        assertThat(TextSanitizer.multiLine(null)).isNull();
    }

    @Test
    void stripsControlAndInvisibleCharacters() {
        assertThat(TextSanitizer.multiLine("Road\u0000 is\u0007 broken‮​﻿")).isEqualTo("Road is broken");
    }

    @Test
    void keepsDevanagariJoiners() {
        String nepali = "सडक‍मा खाल्डो"; // ZWJ is meaningful in Devanagari
        assertThat(TextSanitizer.multiLine(nepali)).isEqualTo(nepali);
    }

    @Test
    void multiLineKeepsParagraphsButCollapsesBlankRuns() {
        assertThat(TextSanitizer.multiLine("First line   \r\n\r\n\r\n\r\nSecond")).isEqualTo("First line\n\nSecond");
    }

    @Test
    void singleLineCollapsesAllWhitespace() {
        assertThat(TextSanitizer.singleLine("  Ram\n\tBahadur  Thapa ")).isEqualTo("Ram Bahadur Thapa");
    }

    @Test
    void lengthCountsCodePointsLikePostgres() {
        assertThat(TextSanitizer.length("😀😀")).isEqualTo(2);
    }
}
