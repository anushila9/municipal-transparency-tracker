package np.gov.egov.tracker.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageReadParam;
import javax.imageio.ImageReader;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageInputStream;
import javax.imageio.stream.ImageOutputStream;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HexFormat;
import java.security.SecureRandom;
import java.util.Iterator;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Validates and stores citizen report photos.
 *
 * <p>Uploads are never stored as sent. The real format is detected from the file's magic bytes (the client's
 * Content-Type and filename are ignored), dimensions are checked before any pixels are decoded (so a small file
 * that expands into a huge bitmap is rejected cheaply), and the image is re-encoded as a downscaled JPEG. That
 * re-encode drops all metadata, including EXIF GPS coordinates, which matters for citizens reporting anonymously,
 * and neutralises polyglot files that are valid images and something else at the same time.
 */
@Service
public class ReportPhotoStorage {

    public static final long MAX_BYTES = 5L * 1024 * 1024;
    private static final int MAX_SIDE = 8_000;
    private static final long MAX_PIXELS = 40_000_000L;
    private static final int OUTPUT_LONG_EDGE = 1_600;
    private static final float JPEG_QUALITY = 0.85f;
    /** Stored names are random, so they can't be guessed or used for path traversal. */
    private static final Pattern KEY = Pattern.compile("[0-9a-f]{32}\\.jpg");

    private final Path dir;
    private final SecureRandom random = new SecureRandom();

    public ReportPhotoStorage(@Value("${app.uploads.dir}") String dir) throws IOException {
        this.dir = Path.of(dir).toAbsolutePath().normalize().resolve("report-photos");
        Files.createDirectories(this.dir);
    }

    /** Thrown for any upload that is not an acceptable photo; the message is safe to show to the citizen. */
    public static class InvalidPhotoException extends Exception {
        public InvalidPhotoException(String message) {
            super(message);
        }
    }

    /** Validates, re-encodes and stores the photo. Returns the storage key to save on the report. */
    public String store(byte[] upload) throws InvalidPhotoException, IOException {
        if (upload.length > MAX_BYTES) throw new InvalidPhotoException("Photo must be 5 MB or smaller.");
        String format = sniffFormat(upload)
                .orElseThrow(() -> new InvalidPhotoException("Photo must be a JPEG or PNG image."));
        BufferedImage decoded = decode(upload, format);
        byte[] jpeg = encodeJpeg(flattenAndResize(decoded));

        String key = HexFormat.of().formatHex(randomBytes()) + ".jpg";
        Path target = dir.resolve(key);
        Path tmp = Files.createTempFile(dir, "upload-", ".tmp");
        try {
            Files.write(tmp, jpeg);
            Files.move(tmp, target);
        } finally {
            Files.deleteIfExists(tmp);
        }
        return key;
    }

    public Optional<Path> find(String key) {
        if (key == null || !KEY.matcher(key).matches()) return Optional.empty();
        Path p = dir.resolve(key);
        return Files.isRegularFile(p) ? Optional.of(p) : Optional.empty();
    }

    public void delete(String key) {
        find(key).ifPresent(p -> {
            try {
                Files.deleteIfExists(p);
            } catch (IOException ignored) {
                // An orphaned file is harmless; the database row is what matters.
            }
        });
    }

    static Optional<String> sniffFormat(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) return Optional.of("jpeg");
        byte[] png = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'};
        if (b.length >= png.length) {
            boolean match = true;
            for (int i = 0; i < png.length && match; i++) match = b[i] == png[i];
            if (match) return Optional.of("png");
        }
        return Optional.empty();
    }

    private static BufferedImage decode(byte[] upload, String format) throws InvalidPhotoException {
        Iterator<ImageReader> readers = ImageIO.getImageReadersByFormatName(format);
        if (!readers.hasNext()) throw new InvalidPhotoException("Photo must be a JPEG or PNG image.");
        ImageReader reader = readers.next();
        try (InputStream in = new ByteArrayInputStream(upload); ImageInputStream iis = ImageIO.createImageInputStream(in)) {
            reader.setInput(iis, true, true); // ignore metadata entirely
            int w = reader.getWidth(0);
            int h = reader.getHeight(0);
            if (w <= 0 || h <= 0 || w > MAX_SIDE || h > MAX_SIDE || (long) w * h > MAX_PIXELS) {
                throw new InvalidPhotoException("Photo dimensions are too large. Use a photo under 8000 × 8000 pixels.");
            }
            ImageReadParam param = reader.getDefaultReadParam();
            // Subsample big images while decoding, so memory stays bounded before the final resize.
            int step = Math.max(1, Math.max(w, h) / (OUTPUT_LONG_EDGE * 2));
            param.setSourceSubsampling(step, step, 0, 0);
            BufferedImage img = reader.read(0, param);
            if (img == null) throw new InvalidPhotoException("This photo couldn't be read. Try a different image.");
            return img;
        } catch (IOException | RuntimeException e) {
            // Truncated/corrupt files, CMYK JPEGs and other oddities surface as IOException or IllegalArgumentException.
            throw new InvalidPhotoException("This photo couldn't be read. Try a different image.");
        } finally {
            reader.dispose();
        }
    }

    /** Draws onto a fresh RGB canvas: drops alpha (onto white) and caps the long edge. */
    private static BufferedImage flattenAndResize(BufferedImage src) {
        double scale = Math.min(1.0, (double) OUTPUT_LONG_EDGE / Math.max(src.getWidth(), src.getHeight()));
        int w = Math.max(1, (int) Math.round(src.getWidth() * scale));
        int h = Math.max(1, (int) Math.round(src.getHeight() * scale));
        BufferedImage out = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = out.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, w, h);
            g.drawImage(src, 0, 0, w, h, null);
        } finally {
            g.dispose();
        }
        return out;
    }

    private static byte[] encodeJpeg(BufferedImage img) throws IOException {
        ImageWriter writer = ImageIO.getImageWritersByFormatName("jpeg").next();
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        try (OutputStream os = bytes; ImageOutputStream ios = ImageIO.createImageOutputStream(os)) {
            writer.setOutput(ios);
            ImageWriteParam p = writer.getDefaultWriteParam();
            p.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            p.setCompressionQuality(JPEG_QUALITY);
            writer.write(null, new IIOImage(img, null, null), p); // no metadata written
        } finally {
            writer.dispose();
        }
        return bytes.toByteArray();
    }

    private byte[] randomBytes() {
        byte[] b = new byte[16];
        random.nextBytes(b);
        return b;
    }
}
