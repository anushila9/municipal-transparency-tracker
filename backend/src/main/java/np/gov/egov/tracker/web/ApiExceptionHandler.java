package np.gov.egov.tracker.web;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * problem+json for all MVC errors, plus a field → message map on validation failures so forms can show
 * errors next to the right input.
 */
@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex, HttpHeaders headers,
                                                                  HttpStatusCode status, WebRequest request) {
        Map<String, String> errors = new LinkedHashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            // Record-level @AssertTrue checks surface as "targetEndDateValid"; map them to the real field.
            String field = fe.getField().endsWith("Valid") ? fe.getField().replaceFirst("^is", "").replaceFirst("Valid$", "") : fe.getField();
            errors.putIfAbsent(field, fe.getDefaultMessage());
        }
        ProblemDetail body = ProblemDetail.forStatusAndDetail(status, "Some fields need attention.");
        body.setProperty("errors", errors);
        return handleExceptionInternal(ex, body, headers, status, request);
    }
}
