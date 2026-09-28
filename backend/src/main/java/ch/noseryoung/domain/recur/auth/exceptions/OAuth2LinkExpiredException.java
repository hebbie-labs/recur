package ch.noseryoung.domain.recur.auth.exceptions;

import org.springframework.http.HttpStatus;

import ch.noseryoung.domain.recur.shared.exceptions.ApiException;

public class OAuth2LinkExpiredException extends ApiException {

    public OAuth2LinkExpiredException() {
        super(HttpStatus.BAD_REQUEST, "OAuth2 link expired",
                "Die Verknüpfungsanfrage ist abgelaufen. Bitte melde dich erneut an.");
    }
}
