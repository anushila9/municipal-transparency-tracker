package np.gov.egov.tracker.service;

import np.gov.egov.tracker.service.ReportPhotoStorage.InvalidPhotoException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.zip.CRC32;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ReportPhotoStorageTest {

    @TempDir
    Path tmp;

    private ReportPhotoStorage storage() throws Exception {
        return new ReportPhotoStorage(tmp.toString());
    }

    private static byte[] png(int w, int h) throws Exception {
        BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(img, "png", out);
        return out.toByteArray();
    }

    @Test
    void storesValidPngAsDownscaledJpeg() throws Exception {
        ReportPhotoStorage s = storage();
        String key = s.store(png(3200, 1600));

        assertThat(key).matches("[0-9a-f]{32}\\.jpg");
        byte[] saved = Files.readAllBytes(s.find(key).orElseThrow());
        assertThat(ReportPhotoStorage.sniffFormat(saved)).hasValue("jpeg");
        BufferedImage img = ImageIO.read(new ByteArrayInputStream(saved));
        assertThat(img.getWidth()).isEqualTo(1600);
        assertThat(img.getHeight()).isEqualTo(800);
    }

    @Test
    void reEncodingDropsBytesSmuggledAfterTheImage() throws Exception {
        byte[] image = png(40, 40);
        byte[] payload = "<script>alert(1)</script>".getBytes(StandardCharsets.US_ASCII);
        byte[] polyglot = ByteBuffer.allocate(image.length + payload.length).put(image).put(payload).array();

        ReportPhotoStorage s = storage();
        byte[] saved = Files.readAllBytes(s.find(s.store(polyglot)).orElseThrow());
        assertThat(new String(saved, StandardCharsets.ISO_8859_1)).doesNotContain("<script>");
    }

    @Test
    void rejectsNonImagesRegardlessOfClaimedType() throws Exception {
        ReportPhotoStorage s = storage();
        assertThatThrownBy(() -> s.store("<html><script>x</script></html>".getBytes()))
                .isInstanceOf(InvalidPhotoException.class).hasMessageContaining("JPEG or PNG");
        assertThatThrownBy(() -> s.store("GIF89a....".getBytes()))
                .isInstanceOf(InvalidPhotoException.class);
    }

    @Test
    void rejectsTruncatedImage() throws Exception {
        byte[] image = png(200, 200);
        byte[] truncated = java.util.Arrays.copyOf(image, 40);
        assertThatThrownBy(() -> storage().store(truncated)).isInstanceOf(InvalidPhotoException.class);
    }

    @Test
    void rejectsDecompressionBombFromHeaderAlone() throws Exception {
        // A tiny file whose header claims 50,000 x 50,000 pixels (10 GB as a bitmap): rejected before decoding.
        assertThatThrownBy(() -> storage().store(pngHeaderOnly(50_000, 50_000)))
                .isInstanceOf(InvalidPhotoException.class).hasMessageContaining("dimensions");
    }

    @Test
    void rejectsOversizedUpload() throws Exception {
        byte[] big = new byte[(int) ReportPhotoStorage.MAX_BYTES + 1];
        big[0] = (byte) 0xFF; big[1] = (byte) 0xD8; big[2] = (byte) 0xFF;
        assertThatThrownBy(() -> storage().store(big)).isInstanceOf(InvalidPhotoException.class).hasMessageContaining("5 MB");
    }

    @Test
    void findRejectsPathTraversalKeys() throws Exception {
        ReportPhotoStorage s = storage();
        assertThat(s.find("../../etc/passwd")).isEmpty();
        assertThat(s.find("..%2F..%2Fsecret.jpg")).isEmpty();
    }

    private static byte[] pngHeaderOnly(int w, int h) {
        ByteBuffer ihdr = ByteBuffer.allocate(13).putInt(w).putInt(h).put((byte) 8).put((byte) 6).put((byte) 0).put((byte) 0).put((byte) 0);
        CRC32 crc = new CRC32();
        crc.update("IHDR".getBytes(StandardCharsets.US_ASCII));
        crc.update(ihdr.array());
        return ByteBuffer.allocate(8 + 4 + 4 + 13 + 4)
                .put(new byte[]{(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'})
                .putInt(13).put("IHDR".getBytes(StandardCharsets.US_ASCII)).put(ihdr.array()).putInt((int) crc.getValue())
                .array();
    }
}
