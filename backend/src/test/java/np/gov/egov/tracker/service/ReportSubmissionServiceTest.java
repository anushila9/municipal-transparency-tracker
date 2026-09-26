package np.gov.egov.tracker.service;

import np.gov.egov.tracker.domain.CitizenReport;
import np.gov.egov.tracker.domain.Project;
import np.gov.egov.tracker.repository.CitizenReportRepository;
import np.gov.egov.tracker.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ReportSubmissionServiceTest {

    private final ProjectRepository projects = mock(ProjectRepository.class);
    private final CitizenReportRepository reports = mock(CitizenReportRepository.class);
    private final ReportPhotoStorage photos = mock(ReportPhotoStorage.class);
    private final ReportSubmissionService service = new ReportSubmissionService(projects, reports, photos);

    @BeforeEach
    void setUp() {
        when(projects.findById(1L)).thenReturn(Optional.of(new Project()));
        when(reports.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    private static java.util.Map<String, String> errorsOf(Runnable r) {
        try {
            r.run();
        } catch (FieldValidationException e) {
            return e.getErrors();
        }
        throw new AssertionError("expected FieldValidationException");
    }

    @Test
    void savesSanitisedValues() {
        service.submit(1L, "  Sita\n Rai​ ", "  Drain cover\u0000 near the temple is broken.  ", null);

        ArgumentCaptor<CitizenReport> saved = ArgumentCaptor.forClass(CitizenReport.class);
        verify(reports).save(saved.capture());
        assertThat(saved.getValue().getReporterName()).isEqualTo("Sita Rai");
        assertThat(saved.getValue().getComment()).isEqualTo("Drain cover near the temple is broken.");
        assertThat(saved.getValue().getPhotoUrl()).isNull();
    }

    @Test
    void anonymousIsAllowed() {
        service.submit(1L, "   ", "The taps are still dry after two months.", null);
        verify(reports).save(argThat(r -> r.getReporterName() == null));
    }

    @Test
    void lengthIsCheckedAfterSanitising() {
        // 2,500 raw characters, but only 30 visible ones: accepted, because the stored value is what counts.
        String padded = "Road is washed out near school" + "​".repeat(2_470);
        service.submit(1L, null, padded, null);
        verify(reports).save(any());

        // Invisible padding can't satisfy the minimum either.
        assertThat(errorsOf(() -> service.submit(1L, null, "ok" + "​".repeat(50), null))).containsKey("comment");
    }

    @Test
    void rejectsMissingShortOversizedAndMeaninglessComments() {
        assertThat(errorsOf(() -> service.submit(1L, null, null, null))).containsKey("comment");
        assertThat(errorsOf(() -> service.submit(1L, null, "too short", null))).containsKey("comment");
        assertThat(errorsOf(() -> service.submit(1L, null, "x".repeat(2_001), null))).containsKey("comment");
        assertThat(errorsOf(() -> service.submit(1L, null, "!!!!!!!!!!!!!!!!", null))).containsKey("comment");
        assertThat(errorsOf(() -> service.submit(1L, null, "x".repeat(1_000_000), null))).containsKey("comment");
        verifyNoInteractions(reports);
    }

    @Test
    void rejectsBadNames() {
        String ok = "Water pipe is leaking at the chowk.";
        assertThat(errorsOf(() -> service.submit(1L, "a".repeat(121), ok, null))).containsKey("reporterName");
        assertThat(errorsOf(() -> service.submit(1L, "12345", ok, null))).containsKey("reporterName");
    }

    @Test
    void doesNotProcessPhotoWhenTextIsInvalid() throws Exception {
        errorsOf(() -> service.submit(1L, null, "short", new byte[]{1, 2, 3}));
        verify(photos, never()).store(any());
    }

    @Test
    void invalidPhotoIsAFieldError() throws Exception {
        when(photos.store(any())).thenThrow(new ReportPhotoStorage.InvalidPhotoException("Photo must be a JPEG or PNG image."));
        assertThat(errorsOf(() -> service.submit(1L, null, "The school wall has collapsed again.", new byte[]{1})))
                .containsEntry("photo", "Photo must be a JPEG or PNG image.");
        verifyNoInteractions(reports);
    }

    @Test
    void deletesStoredPhotoIfSavingTheReportFails() throws Exception {
        when(photos.store(any())).thenReturn("abc.jpg");
        when(reports.save(any())).thenThrow(new IllegalStateException("db down"));
        assertThatThrownBy(() -> service.submit(1L, null, "The school wall has collapsed again.", new byte[]{1}))
                .isInstanceOf(IllegalStateException.class);
        verify(photos).delete("abc.jpg");
    }

    @Test
    void unknownProjectIs404() {
        assertThatThrownBy(() -> service.submit(99L, null, "The school wall has collapsed again.", null))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("404");
    }
}
