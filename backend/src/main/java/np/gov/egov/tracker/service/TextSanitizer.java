package np.gov.egov.tracker.service;

import java.text.Normalizer;
import java.util.regex.Pattern;

/**
 * Normalises free text before it is validated and stored. Output is still escaped when rendered (React does
 * this); the goal here is to store clean, canonical text and to measure length on what will actually be saved.
 */
public final class TextSanitizer {

    /**
     * Control characters (except newline and tab), plus invisible characters that can hide or reorder text:
     * zero-width space, LRM/RLM, bidi embeddings/overrides/isolates, word joiners and the BOM.
     * ZWJ/ZWNJ (U+200C/U+200D) are deliberately kept: Nepali text in Devanagari uses them for half-forms.
     */
    private static final Pattern INVISIBLE =
            Pattern.compile("[\\p{Cc}&&[^\\n\\t]]|[\\u200B\\u200E\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u2069\\uFEFF]");
    private static final Pattern TRAILING_SPACE = Pattern.compile("[ \\t]+\\n");
    private static final Pattern EXTRA_BLANK_LINES = Pattern.compile("\\n{3,}");
    private static final Pattern ANY_WHITESPACE = Pattern.compile("[\\s\\p{Z}]+"); // includes non-breaking and other Unicode spaces

    private TextSanitizer() {
    }

    /** Multi-line text: keeps paragraphs, drops invisible characters and runs of blank lines. Blank → null. */
    public static String multiLine(String s) {
        if (s == null) return null;
        String t = Normalizer.normalize(s, Normalizer.Form.NFC).replace("\r\n", "\n").replace('\r', '\n');
        t = INVISIBLE.matcher(t).replaceAll("");
        t = TRAILING_SPACE.matcher(t).replaceAll("\n");
        t = EXTRA_BLANK_LINES.matcher(t).replaceAll("\n\n").strip();
        return t.isEmpty() ? null : t;
    }

    /** Single-line text such as a name: all whitespace (including newlines) collapses to one space. Blank → null. */
    public static String singleLine(String s) {
        if (s == null) return null;
        String t = Normalizer.normalize(s, Normalizer.Form.NFC);
        t = INVISIBLE.matcher(t).replaceAll("");
        t = ANY_WHITESPACE.matcher(t).replaceAll(" ").strip();
        return t.isEmpty() ? null : t;
    }

    /** Length in characters as PostgreSQL counts them (code points), so limits match the column sizes. */
    public static int length(String s) {
        return s == null ? 0 : s.codePointCount(0, s.length());
    }
}
